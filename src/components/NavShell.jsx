import { useEffect, useState, useRef } from 'react';
import {
  Sun,
  Moon,
  Menu,
  BookOpen,
  Library,
  Archive as ArchiveIcon,
  Settings as SettingsIcon,
} from 'lucide-react';
import NavDrawer from './NavDrawer.jsx';
import InstallPrompt from './InstallPrompt.jsx';
import { initServiceWorker } from '../sw-register.js';

// The chrome every page shares: header (brand, hamburger, theme toggle),
// slide-in nav drawer, install prompt, and the bottom tab bar. This used to
// live inside App.jsx's HashRouter, wrapping a client-only <Routes> switch.
// Astro now serves each route as its own server-rendered page (see
// src/layouts/Layout.astro and src/pages/*.astro), so there is no client
// router left to run: this component is the one interactive island every
// page mounts (client:load, never client:only), and the page's own
// server-rendered content is passed in as `children` and simply displayed
// inside <main>. Astro renders that slot content to static HTML at build
// time, so it is already present in the page source before this island
// hydrates; nothing here re-renders it.
//
// `currentPath` is Astro.url.pathname, passed down from the page so the
// bottom nav and drawer can mark the active destination without a router
// context to ask.
const THEME_KEY = 'havruta-theme';

// The pre-paint inline script in Layout.astro sets data-theme on <html>
// before first paint, using the same key, so there is no flash of the wrong
// theme. This reads that attribute back into React state on mount; the
// server-rendered default in the script (and here) is 'dark', matching, so
// there is nothing to reconcile.
function readTheme() {
  if (typeof document !== 'undefined') {
    const current = document.documentElement.getAttribute('data-theme');
    if (current === 'dark' || current === 'light') return current;
  }
  return 'dark';
}

function Header({ onOpenMenu, menuButtonRef }) {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Private-browsing or storage-quota failure; the toggle still works for
      // this session, it just will not persist.
    }
    setTheme(next);
  }

  return (
    <header className="app-header">
      <div className="app-header__left">
        <button
          type="button"
          ref={menuButtonRef}
          className="icon-button"
          onClick={onOpenMenu}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <a href="/" className="app-header__brand">
          Havruta
        </a>
      </div>
      <button
        type="button"
        className="icon-button"
        onClick={toggleTheme}
        aria-label="Toggle dark/light mode"
      >
        {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
      </button>
    </header>
  );
}

const NAV_ITEMS = [
  { to: '/', label: 'Today', Icon: BookOpen, end: true },
  { to: '/shas', label: 'Shas', Icon: Library, end: false },
  { to: '/archive', label: 'Archive', Icon: ArchiveIcon, end: false },
  { to: '/settings', label: 'Settings', Icon: SettingsIcon, end: false },
];

function isCurrent(to, end, currentPath) {
  if (!currentPath) return false;
  if (end) return currentPath === to;
  return currentPath === to || currentPath.startsWith(`${to}/`);
}

function BottomNav({ currentPath }) {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {NAV_ITEMS.map(({ to, label, Icon, end }) => {
        const active = isCurrent(to, end, currentPath);
        return (
          <a
            key={to}
            href={to}
            className={active ? 'bottom-nav__item is-active' : 'bottom-nav__item'}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={22} aria-hidden="true" />
            <span>{label}</span>
          </a>
        );
      })}
    </nav>
  );
}

export default function NavShell({ currentPath, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);

  // Astro mounts this island once per page load, so the service-worker
  // registration that used to run from App.jsx's mount effect runs from here
  // instead. The self-heal in sw-register.js (the controllerchange reload and
  // the chunk-load recovery) is unchanged.
  useEffect(() => {
    initServiceWorker();
  }, []);

  return (
    <div className="app-shell">
      <Header onOpenMenu={() => setMenuOpen(true)} menuButtonRef={menuButtonRef} />
      <NavDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        returnFocusRef={menuButtonRef}
        currentPath={currentPath}
      />
      {children}
      <InstallPrompt />
      <BottomNav currentPath={currentPath} />
    </div>
  );
}
