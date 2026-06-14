import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

// A quiet invitation to add the app to the home screen. On browsers that fire
// beforeinstallprompt (Android Chrome and the like) it offers a one-tap install.
// On iOS Safari, where that event never fires, it shows the one line a reader
// needs: use Share, then Add to Home Screen. It shows only when the app is not
// already installed, and a dismissal is remembered so it does not nag.

const DISMISS_KEY = 'havruta-install-dismissed';

// True when the app is already running from the home screen, so there is nothing
// to invite.
function isStandalone() {
  if (typeof window === 'undefined') return false;
  const media = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
  // iOS Safari reports standalone on navigator rather than the display-mode query.
  const iosStandalone = window.navigator && window.navigator.standalone === true;
  return Boolean(media || iosStandalone);
}

// True on iPhone or iPad Safari, where the install has to be done by hand
// through the Share menu.
function isIosSafari() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIos = /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS reports as a Mac but has touch points.
    (/Macintosh/.test(ua) && typeof document !== 'undefined' && 'ontouchend' in document);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return isIos && isSafari;
}

function wasDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export default function InstallPrompt() {
  // The stashed beforeinstallprompt event, available only on browsers that fire
  // it. Holding it lets the install run on a later tap.
  const [deferred, setDeferred] = useState(null);
  // Whether to show the iOS hint, which has no event to wait for.
  const [showIosHint, setShowIosHint] = useState(false);
  // A dismissal hides the invitation for this visit and is remembered.
  const [dismissed, setDismissed] = useState(() => wasDismissed());

  useEffect(() => {
    if (dismissed || isStandalone()) return undefined;

    function onBeforeInstall(e) {
      // Keep the browser's own mini-infobar from showing; offer our own quiet
      // invitation instead, and hold the event for the tap.
      e.preventDefault();
      setDeferred(e);
    }

    function onInstalled() {
      // Once installed, there is nothing left to invite.
      setDeferred(null);
      setShowIosHint(false);
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    // iOS Safari never fires beforeinstallprompt, so offer the manual hint there.
    if (isIosSafari()) {
      setShowIosHint(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [dismissed]);

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Storage unavailable; the invitation stays gone for this visit at least.
    }
  }

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    try {
      await deferred.userChoice;
    } catch {
      // The reader closed the browser's dialog; nothing to record.
    }
    // The event can be used once. Drop it and remember the invitation is done.
    setDeferred(null);
    dismiss();
  }

  if (dismissed) return null;

  // Nothing to show: no install event and not iOS Safari, or already installed.
  if (!deferred && !showIosHint) return null;

  return (
    <div
      role="region"
      aria-label="Add Havruta to your home screen"
      style={{
        position: 'fixed',
        left: 'var(--space-md)',
        right: 'var(--space-md)',
        bottom: 'calc(64px + env(safe-area-inset-bottom, 0px) + var(--space-sm))',
        zIndex: 40,
        maxWidth: 'var(--max-width)',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        padding: 'var(--space-sm) var(--space-md)',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
      }}
    >
      <Download size={20} aria-hidden="true" style={{ color: 'var(--accent)', flexShrink: 0 }} />
      {deferred ? (
        <>
          <p style={{ margin: 0, flex: 1, fontSize: '0.95rem' }}>
            Add Havruta to your home screen to open it like an app.
          </p>
          <button type="button" className="pill-button pill-button--active" onClick={install}>
            Add
          </button>
        </>
      ) : (
        <p style={{ margin: 0, flex: 1, fontSize: '0.95rem' }}>
          To keep Havruta on your home screen, tap the Share button, then Add to
          Home Screen.
        </p>
      )}
      <button
        type="button"
        className="icon-button icon-button--sm"
        onClick={dismiss}
        aria-label="Dismiss the install invitation"
        style={{ flexShrink: 0 }}
      >
        <X size={18} />
      </button>
    </div>
  );
}
