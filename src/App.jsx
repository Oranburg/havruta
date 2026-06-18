import { useEffect, useState, useRef } from 'react';
import { HashRouter, Routes, Route, NavLink, Link } from 'react-router-dom';
import {
  Sun,
  Moon,
  Menu,
  BookOpen,
  Library,
  Archive as ArchiveIcon,
  Settings as SettingsIcon,
} from 'lucide-react';

import Today from './pages/Today.jsx';
import Shas from './pages/Shas.jsx';
import Archive from './pages/Archive.jsx';
import Settings from './pages/Settings.jsx';
import Learn from './pages/Learn.jsx';
import Why from './pages/Why.jsx';
import Find from './pages/Find.jsx';
import Start from './pages/Start.jsx';
import Terms from './pages/Terms.jsx';
import Journey from './pages/Journey.jsx';
import NotFound from './pages/NotFound.jsx';
import InstallPrompt from './components/InstallPrompt.jsx';
import NavDrawer from './components/NavDrawer.jsx';
import { initServiceWorker } from './sw-register.js';

const THEME_KEY = 'havruta-theme';

function readTheme() {
  if (typeof document !== 'undefined') {
    const current = document.documentElement.getAttribute('data-theme');
    if (current === 'dark' || current === 'light') return current;
  }
  return 'dark';
}

function Header({ onOpenMenu, menuButtonRef }) {
  const [theme, setTheme] = useState(readTheme);

  // Keep React state in sync with the attribute set by the pre-paint script.
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
        <Link to="/" className="app-header__brand">
          Havruta
        </Link>
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

function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {NAV_ITEMS.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            isActive ? 'bottom-nav__item is-active' : 'bottom-nav__item'
          }
        >
          <Icon size={22} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function Footer() {
  return (
    <footer className="app-footer">
      Havruta by Seth Oranburg, after the Silicon Havruta in <em>Judgment Proof</em>.{' '}
      <a href="https://oranburg.law" target="_blank" rel="noreferrer">
        oranburg.law
      </a>
    </footer>
  );
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);

  // Astro mounts this island, so the service-worker registration that used to
  // run after createRoot in main.jsx now runs from the app's own mount effect.
  // The self-heal in sw-register.js (the controllerchange reload and the
  // chunk-load recovery) is unchanged.
  useEffect(() => {
    initServiceWorker();
  }, []);

  return (
    <HashRouter>
      <div className="app-shell">
        <Header
          onOpenMenu={() => setMenuOpen(true)}
          menuButtonRef={menuButtonRef}
        />
        <NavDrawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          returnFocusRef={menuButtonRef}
        />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Today />} />
            <Route path="/shas" element={<Shas />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/why" element={<Why />} />
            <Route path="/find" element={<Find />} />
            <Route path="/start" element={<Start />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/journey" element={<Journey />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
        </main>
        <InstallPrompt />
        <BottomNav />
      </div>
    </HashRouter>
  );
}
