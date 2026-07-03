import { useEffect, useRef } from 'react';
import {
  X,
  BookOpen,
  Library,
  Archive as ArchiveIcon,
  Settings as SettingsIcon,
  GraduationCap,
  Heart,
  Compass,
  Play,
  BookA,
  Map,
} from 'lucide-react';

// Every destination the app can reach lives here. The four core pages also sit
// in the bottom tab bar; the drawer is the fuller menu and is where content
// pages like How the daf is learned live. Adding a page means adding one entry
// to this list, nothing more.
const DRAWER_ITEMS = [
  { to: '/', label: 'Today', Icon: BookOpen, end: true },
  { to: '/shas', label: 'Shas', Icon: Library, end: false },
  { to: '/archive', label: 'Archive', Icon: ArchiveIcon, end: false },
  { to: '/settings', label: 'Settings', Icon: SettingsIcon, end: false },
  { to: '/learn', label: 'How the daf is learned', Icon: GraduationCap, end: false },
  { to: '/why', label: 'Why this exists', Icon: Heart, end: false },
  { to: '/find', label: 'Find your way in', Icon: Compass, end: false },
  { to: '/start', label: 'Start here', Icon: Play, end: false },
  { to: '/terms', label: 'Key terms', Icon: BookA, end: false },
  { to: '/journey', label: 'The journey', Icon: Map, end: false },
];

// True when `to` names the current route. `end: true` entries (just "/") only
// match the exact root; every other entry matches the root plus anything that
// starts with it, so a page and its own querystring both count.
//
// This used to be react-router's NavLink `isActive`. Astro pages are real,
// separately built HTML documents, not client-routed views inside one SPA
// shell, so there is no router context here to ask; the current path is passed
// in as a plain prop instead (Astro.url.pathname on the server, read once).
function isCurrent(to, end, currentPath) {
  if (!currentPath) return false;
  if (end) return currentPath === to;
  return currentPath === to || currentPath.startsWith(`${to}/`);
}

// A slide-in navigation drawer opened from the header hamburger. It traps the
// reader's attention as a modal: focus moves into it on open, Escape closes it,
// a tap outside closes it, and selecting a link closes it. On close, focus
// returns to the button that opened it.
export default function NavDrawer({ open, onClose, returnFocusRef, currentPath }) {
  const panelRef = useRef(null);
  const firstLinkRef = useRef(null);

  // Move focus into the drawer when it opens and return it to the opener when it
  // closes, so a keyboard reader is never stranded.
  useEffect(() => {
    if (open) {
      // Focus the first link once the panel has mounted.
      const id = window.requestAnimationFrame(() => {
        if (firstLinkRef.current) firstLinkRef.current.focus();
      });
      return () => window.cancelAnimationFrame(id);
    }
    if (returnFocusRef && returnFocusRef.current) {
      returnFocusRef.current.focus();
    }
    return undefined;
  }, [open, returnFocusRef]);

  // Escape closes the drawer, and a simple focus trap keeps Tab inside it while
  // it is open.
  useEffect(() => {
    if (!open) return undefined;

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="nav-drawer__overlay"
      onClick={onClose}
      role="presentation"
    >
      <nav
        ref={panelRef}
        className="nav-drawer"
        aria-label="All pages"
        // Stop a tap inside the panel from reaching the overlay's close handler.
        onClick={(e) => e.stopPropagation()}
      >
        <div className="nav-drawer__header">
          <span className="nav-drawer__title">Havruta</span>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        <div className="nav-drawer__list">
          {DRAWER_ITEMS.map(({ to, label, Icon, end }, index) => (
            <a
              key={to}
              href={to}
              ref={index === 0 ? firstLinkRef : undefined}
              className={
                isCurrent(to, end, currentPath)
                  ? 'nav-drawer__item is-active'
                  : 'nav-drawer__item'
              }
              aria-current={isCurrent(to, end, currentPath) ? 'page' : undefined}
              onClick={onClose}
            >
              <Icon size={22} aria-hidden="true" />
              <span>{label}</span>
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}
