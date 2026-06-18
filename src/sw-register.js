// Service-worker registration and self-heal.
//
// The deploy target is GitHub Pages, where a returning visitor is served by a
// previously installed service worker. Two failures follow from that and both
// are handled here:
//
//   1. A new build is live but the old service worker keeps serving the old
//      precache. With registerType 'autoUpdate' plus skipWaiting/clientsClaim
//      in the workbox config, the new worker activates on its own; we add a
//      single controlled reload when the controller changes so the page lands
//      on the fresh build without a manual hard reload.
//
//   2. The page boots from a stale precache that names hashed chunk files the
//      new deploy has already replaced. The dynamic import fails and the page
//      goes black. We catch that error, clear the service workers and caches
//      once, and reload onto a clean fetch. This is the actual fix for the
//      observed black-page-until-incognito case.
//
// Every reload path is guarded by a sessionStorage flag so a genuinely broken
// build cannot loop.

import { registerSW } from 'virtual:pwa-register';

const CONTROLLER_RELOAD_FLAG = 'havruta-sw-controller-reloaded';
const CHUNK_HEAL_FLAG = 'havruta-chunk-heal-attempted';

function sessionFlagSet(key) {
  try {
    return sessionStorage.getItem(key) === '1';
  } catch {
    // No sessionStorage (private mode quirks, disabled storage): treat the flag
    // as already set so we never loop when we cannot record that we tried.
    return true;
  }
}

function setSessionFlag(key) {
  try {
    sessionStorage.setItem(key, '1');
  } catch {
    // Ignore: if we cannot record the attempt, sessionFlagSet returns true and
    // the guard holds.
  }
}

// 1. Register the worker and reload once when a new worker takes control.
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  registerSW({ immediate: true });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (sessionFlagSet(CONTROLLER_RELOAD_FLAG)) return;
    setSessionFlag(CONTROLLER_RELOAD_FLAG);
    window.location.reload();
  });
}

// 2. Self-heal a stale precache that points at chunks the new deploy removed.
function looksLikeChunkLoadError(message) {
  if (!message) return false;
  const m = String(message);
  return (
    /Failed to fetch dynamically imported module/i.test(m) ||
    /error loading dynamically imported module/i.test(m) ||
    /Importing a module script failed/i.test(m) ||
    /ChunkLoadError/i.test(m) ||
    /Loading chunk [\w-]+ failed/i.test(m)
  );
}

async function healChunkLoadFailure() {
  if (sessionFlagSet(CHUNK_HEAL_FLAG)) return;
  setSessionFlag(CHUNK_HEAL_FLAG);

  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    // Even if cleanup partly fails, a reload onto a clean fetch is the best
    // available recovery.
  }
  window.location.reload();
}

export function installChunkLoadSelfHeal() {
  window.addEventListener('error', (event) => {
    const msg = event?.message || event?.error?.message;
    if (looksLikeChunkLoadError(msg)) healChunkLoadFailure();
  });
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const msg = typeof reason === 'string' ? reason : reason?.message;
    if (looksLikeChunkLoadError(msg)) healChunkLoadFailure();
  });
}

export function initServiceWorker() {
  installChunkLoadSelfHeal();
  registerServiceWorker();
}
