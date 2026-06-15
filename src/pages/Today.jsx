import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  X,
  Lock,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import {
  getTodaysDaf,
  getDafText,
  getDafImages,
  sefariaUrl,
} from '../lib/sefaria.js';
import { readProviderSettings } from '../lib/partner.js';
import Havruta from '../components/Havruta.jsx';
import LineHavruta from '../components/LineHavruta.jsx';
import Commentaries from '../components/Commentaries.jsx';
import Connections from '../components/Connections.jsx';
import ScrollProgress from '../components/ScrollProgress.jsx';
import WordPopover from '../components/WordPopover.jsx';
import TappableHebrew from '../components/TappableHebrew.jsx';
import TranslationCompare from '../components/TranslationCompare.jsx';

// Reading views the toggle offers.
const VIEWS = [
  { id: 'both', label: 'Both' },
  { id: 'hebrew', label: 'Hebrew only' },
  { id: 'english', label: 'English only' },
];

// Font-size steps. The Hebrew runs larger than the body by default because
// the reader is on a phone and prefers large Hebrew type.
const HE_MIN = 18;
const HE_MAX = 40;
const EN_MIN = 14;
const EN_MAX = 28;

// Reading preferences persist across visits, so the reader does not reset the
// view and the type sizes every day. The large defaults below hold when nothing
// is saved.
const VIEW_STORAGE = 'havruta-view';
const HE_SIZE_STORAGE = 'havruta-he-size';
const EN_SIZE_STORAGE = 'havruta-en-size';
const TRANSLIT_STORAGE = 'havruta-translit';
const DEFAULT_VIEW = 'both';
const DEFAULT_HE_SIZE = 26;
const DEFAULT_EN_SIZE = 18;

// The one-line disclaimer. It sits by the toggle so a reader knows the
// romanization is a guide, not authority.
const TRANSLIT_DISCLAIMER =
  'Transliteration follows the Shofar magazine chart for the consonants. It is a pronunciation guide, not authority, and is rougher on Aramaic.';

// Read a saved view, falling back to the default when nothing valid is stored.
function readSavedView() {
  try {
    const saved = localStorage.getItem(VIEW_STORAGE);
    if (VIEWS.some((v) => v.id === saved)) return saved;
  } catch {
    // localStorage unavailable; use the default.
  }
  return DEFAULT_VIEW;
}

// Read the saved transliteration preference, defaulting to off. The earlier
// scheme key counts as on for anything other than 'none'.
function readSavedTranslit() {
  try {
    const v = localStorage.getItem(TRANSLIT_STORAGE);
    if (v === 'on') return true;
    if (v === 'off' || v === null) return false;
    // A leftover scheme id from the dropdown build: anything but 'none' is on.
    return v !== 'none';
  } catch {
    // localStorage unavailable; default off.
  }
  return false;
}

// Read a saved font size, clamped to its range, falling back to the default.
function readSavedSize(storageKey, fallback, min, max) {
  try {
    const saved = Number(localStorage.getItem(storageKey));
    if (Number.isFinite(saved) && saved >= min && saved <= max) return saved;
  } catch {
    // localStorage unavailable; use the default.
  }
  return fallback;
}

export default function Today() {
  const location = useLocation();
  const [daf, setDaf] = useState(null);
  const [text, setText] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [view, setView] = useState(readSavedView);
  const [heSize, setHeSize] = useState(() =>
    readSavedSize(HE_SIZE_STORAGE, DEFAULT_HE_SIZE, HE_MIN, HE_MAX)
  );
  const [enSize, setEnSize] = useState(() =>
    readSavedSize(EN_SIZE_STORAGE, DEFAULT_EN_SIZE, EN_MIN, EN_MAX)
  );
  const [showTranslit, setShowTranslit] = useState(readSavedTranslit);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // One word-lookup popover is open at a time across both amudim. The Amud
  // segments report a tapped word up to here, and the single WordPopover below
  // renders it, so a second tap replaces the first rather than stacking.
  const [activeWord, setActiveWord] = useState(null); // { word, rect } or null
  const openWord = useCallback((word, el) => {
    const rect = el ? el.getBoundingClientRect() : null;
    setActiveWord({ word, rect });
  }, []);
  const closeWord = useCallback(() => setActiveWord(null), []);

  // The human-acts-first gate. The partner stays locked until the reader
  // submits a reading of their own. See docs/CONSTITUTION.md requirement 1.
  const [reading, setReading] = useState('');
  const [readingSubmitted, setReadingSubmitted] = useState(false);

  // Load a daf by ref. With no ref, ask Sefaria for today's daf.
  const load = useCallback(async (ref) => {
    setLoading(true);
    setError(null);
    setReading('');
    setReadingSubmitted(false);
    setActiveWord(null);
    try {
      let dafInfo;
      if (ref) {
        dafInfo = { ref, displayEn: ref, displayHe: '' };
      } else {
        dafInfo = await getTodaysDaf();
      }
      const [textResult, imageResult] = await Promise.all([
        getDafText(dafInfo.ref),
        getDafImages(`${dafInfo.ref}a`).catch(() => []),
      ]);
      setDaf(dafInfo);
      setText(textResult);
      setImages(imageResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setText(null);
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load today's daf by default, or a specific daf when the Shas map links here
  // with ?daf=Tractate%20Number. Reload when that param changes so tapping a
  // different daf in the map reloads this page at it.
  const dafParam = new URLSearchParams(location.search).get('daf');
  useEffect(() => {
    load(dafParam || null);
  }, [load, dafParam]);

  // Persist the reading preferences as they change, so the next visit opens with
  // the same view and type sizes.
  useEffect(() => {
    try {
      localStorage.setItem(VIEW_STORAGE, view);
    } catch {
      // localStorage unavailable; the choice holds for this visit only.
    }
  }, [view]);

  useEffect(() => {
    try {
      localStorage.setItem(HE_SIZE_STORAGE, String(heSize));
    } catch {
      // localStorage unavailable; the choice holds for this visit only.
    }
  }, [heSize]);

  useEffect(() => {
    try {
      localStorage.setItem(EN_SIZE_STORAGE, String(enSize));
    } catch {
      // localStorage unavailable; the choice holds for this visit only.
    }
  }, [enSize]);

  useEffect(() => {
    try {
      localStorage.setItem(TRANSLIT_STORAGE, showTranslit ? 'on' : 'off');
    } catch {
      // localStorage unavailable; the choice holds for this visit only.
    }
  }, [showTranslit]);

  // The next/prev daf refs come from amud b's next and amud a's prev so we
  // step a whole daf at a time. Sefaria returns amud-level refs, so we read
  // the base daf name from them.
  const baseDafFromAmud = (amudRef) => {
    if (!amudRef) return null;
    return amudRef.replace(/[ab]$/, '').trim();
  };
  const nextDaf = text ? baseDafFromAmud(text.b.next) : null;
  const prevDaf = text ? baseDafFromAmud(text.a.prev) : null;

  function submitReading() {
    if (reading.trim().length === 0) return;
    setReadingSubmitted(true);
  }

  if (loading) {
    return (
      <section>
        <p style={{ color: 'var(--muted)' }}>
          Loading today&rsquo;s daf from Sefaria. One moment.
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h1>Today&rsquo;s daf</h1>
        <div className="card" style={{ marginTop: 'var(--space-md)' }}>
          <p>
            The text could not be loaded right now. The app shows only what
            Sefaria supplies, so there is nothing to display until the
            connection returns.
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{error}</p>
          <button
            type="button"
            className="pill-button"
            onClick={() => load(daf ? daf.ref : null)}
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  const hasImage = images.length > 0;

  return (
    <section>
      <ScrollProgress />

      {/* The page image leads. Above it there is only a minimal title bar with
          the daf reference and an open-on-Sefaria link, because the visual page
          is the first thing the reader should see. Everything that the reader
          acts on (reading, partner, transcribed text, controls, commentaries,
          connections, navigation) sits below the image. */}
      <TitleBar daf={daf} />

      {hasImage ? (
        <PageImage image={images[0]} onOpen={() => setLightboxOpen(true)} />
      ) : (
        <p
          className="card"
          style={{ margin: '0 0 var(--space-lg)', color: 'var(--muted)' }}
        >
          No page image is available for this daf, so the transcribed text leads
          below.
        </p>
      )}

      <PartnerIntro submitted={readingSubmitted} />

      <DafNav prevDaf={prevDaf} nextDaf={nextDaf} onGo={load} />

      <Controls
        view={view}
        setView={setView}
        heSize={heSize}
        setHeSize={setHeSize}
        enSize={enSize}
        setEnSize={setEnSize}
        showTranslit={showTranslit}
        setShowTranslit={setShowTranslit}
      />

      {text && (
        <>
          <Amud
            label="א"
            amudName="Amud a"
            amud={text.a}
            view={view}
            heSize={heSize}
            enSize={enSize}
            showTranslit={showTranslit}
            onWordTap={openWord}
            daf={daf}
          />
          <Amud
            label="ב"
            amudName="Amud b"
            amud={text.b}
            view={view}
            heSize={heSize}
            enSize={enSize}
            showTranslit={showTranslit}
            onWordTap={openWord}
            daf={daf}
          />
        </>
      )}

      <DafNav prevDaf={prevDaf} nextDaf={nextDaf} onGo={load} />

      {daf && (
        <>
          <Commentaries dafRef={daf.ref} heSize={heSize} enSize={enSize} />
          <Connections dafRef={daf.ref} heSize={heSize} enSize={enSize} />
        </>
      )}

      <ReadingGate
        reading={reading}
        setReading={setReading}
        submitted={readingSubmitted}
        onSubmit={submitReading}
        daf={daf}
        text={text}
      />

      {lightboxOpen && images.length > 0 && (
        <Lightbox image={images[0]} onClose={() => setLightboxOpen(false)} />
      )}

      {activeWord && (
        <WordPopover
          word={activeWord.word}
          anchor={activeWord.rect}
          onClose={closeWord}
        />
      )}
    </section>
  );
}

// The minimal title bar that sits above the page image. It carries the daf
// reference in English and, when Sefaria supplies it, in Hebrew, plus the quiet
// open-on-Sefaria link. Nothing else stands above the image.
function TitleBar({ daf }) {
  if (!daf) return null;
  return (
    <header style={{ marginBottom: 'var(--space-md)' }}>
      <h1 style={{ marginBottom: 'var(--space-xs)' }}>{daf.displayEn}</h1>
      {daf.displayHe && (
        <p
          className="hebrew"
          style={{
            fontSize: '1.4rem',
            color: 'var(--accent-2)',
            margin: '0 0 var(--space-sm)',
          }}
        >
          {daf.displayHe}
        </p>
      )}
      <p style={{ margin: 0 }}>
        <a
          href={sefariaUrl(daf.ref)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          Open this daf on Sefaria <ExternalLink size={16} aria-hidden="true" />
        </a>
      </p>
    </header>
  );
}

function hasSavedKey() {
  try {
    return Boolean(readProviderSettings().apiKey);
  } catch {
    return false;
  }
}

// Makes the study partner obvious from the first look. With no key saved it
// invites the one setup step; with a key it points the reader to take up a line.
function PartnerIntro({ submitted }) {
  const [keyed] = useState(hasSavedKey);

  if (submitted) return null;

  if (!keyed) {
    return (
      <div
        className="card"
        style={{
          marginBottom: 'var(--space-lg)',
          borderColor: 'var(--accent)',
        }}
      >
        <h2
          style={{
            marginTop: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            borderBottom: 'none',
            paddingBottom: 0,
          }}
        >
          <MessageSquare size={22} aria-hidden="true" />
          Study with your havruta
        </h2>
        <p style={{ margin: '0 0 var(--space-md)' }}>
          This page has a study partner that challenges your reading instead of
          explaining the daf. It runs on an AI model using your own key, kept only
          on this device, and there is a free option so it need not cost anything.
          Set it up once to begin.
        </p>
        <Link to="/settings" className="pill-button pill-button--active">
          Set up the partner in Settings
        </Link>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
      <p style={{ margin: '0 0 var(--space-sm)' }}>
        Read a line, then open <strong>Discuss this line</strong> beneath it:
        say in a sentence what the line is doing, and your havruta challenges
        that reading using the line&rsquo;s own words. Stop wherever the page
        gives you trouble; you need not discuss every line. Tap any Hebrew word
        to hear how to say it and what it means.
      </p>
      <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>
        When you want to pull the page together, a reading of the whole page
        waits at the end.
      </p>
    </div>
  );
}

function DafNav({ prevDaf, nextDaf, onGo }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 'var(--space-sm)',
        margin: 'var(--space-md) 0',
      }}
    >
      <button
        type="button"
        className="pill-button"
        disabled={!prevDaf}
        onClick={() => prevDaf && onGo(prevDaf)}
        aria-label={prevDaf ? `Previous daf, ${prevDaf}` : 'Previous daf'}
      >
        <ChevronLeft size={18} /> {prevDaf || 'Start'}
      </button>
      <button
        type="button"
        className="pill-button"
        disabled={!nextDaf}
        onClick={() => nextDaf && onGo(nextDaf)}
        aria-label={nextDaf ? `Next daf, ${nextDaf}` : 'Next daf'}
      >
        {nextDaf || 'End'} <ChevronRight size={18} />
      </button>
    </div>
  );
}

function Controls({
  view,
  setView,
  heSize,
  setHeSize,
  enSize,
  setEnSize,
  showTranslit,
  setShowTranslit,
}) {
  const step = (set, value, delta, min, max) =>
    set(Math.min(max, Math.max(min, value + delta)));

  return (
    <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
      <div
        role="group"
        aria-label="Reading view"
        style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}
      >
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            className={
              view === v.id ? 'pill-button pill-button--active' : 'pill-button'
            }
            aria-pressed={view === v.id}
            onClick={() => setView(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 'var(--space-lg)',
          flexWrap: 'wrap',
          marginTop: 'var(--space-md)',
        }}
      >
        <SizeControl
          label="Hebrew size"
          onMinus={() => step(setHeSize, heSize, -2, HE_MIN, HE_MAX)}
          onPlus={() => step(setHeSize, heSize, 2, HE_MIN, HE_MAX)}
        />
        <SizeControl
          label="Text size"
          onMinus={() => step(setEnSize, enSize, -1, EN_MIN, EN_MAX)}
          onPlus={() => step(setEnSize, enSize, 1, EN_MIN, EN_MAX)}
        />
      </div>

      <div style={{ marginTop: 'var(--space-md)' }}>
        <button
          type="button"
          className={
            showTranslit ? 'pill-button pill-button--active' : 'pill-button'
          }
          aria-pressed={showTranslit}
          onClick={() => setShowTranslit(!showTranslit)}
        >
          Show transliteration
        </button>
        {showTranslit && (
          <p
            style={{
              color: 'var(--muted)',
              fontSize: '0.85rem',
              lineHeight: 1.5,
              margin: 'var(--space-sm) 0 0',
            }}
          >
            {TRANSLIT_DISCLAIMER}
          </p>
        )}
      </div>
    </div>
  );
}

function SizeControl({ label, onMinus, onPlus }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
      <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{label}</span>
      <button
        type="button"
        className="icon-button icon-button--sm"
        onClick={onMinus}
        aria-label={`Shrink ${label.toLowerCase()}`}
      >
        <Minus size={18} />
      </button>
      <button
        type="button"
        className="icon-button icon-button--sm"
        onClick={onPlus}
        aria-label={`Grow ${label.toLowerCase()}`}
      >
        <Plus size={18} />
      </button>
    </div>
  );
}

function PageImage({ image, onOpen }) {
  return (
    <figure style={{ margin: '0 0 var(--space-lg)' }}>
      <button
        type="button"
        onClick={onOpen}
        style={{
          display: 'block',
          width: '100%',
          padding: 0,
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          background: 'var(--bg-soft)',
          cursor: 'zoom-in',
        }}
        aria-label={`Enlarge the page image, ${image.label}`}
      >
        <img
          src={image.imageUrl}
          alt={`Talmud page, ${image.label}`}
          loading="lazy"
          style={{ display: 'block', width: '100%', height: 'auto' }}
        />
      </button>
      <figcaption
        style={{
          color: 'var(--muted)',
          fontSize: '0.85rem',
          marginTop: 'var(--space-xs)',
          textAlign: 'center',
        }}
      >
        {image.label}
      </figcaption>
    </figure>
  );
}

// Zoom bounds for the page image. The dense Vilna page needs to enlarge well
// past its fit-to-screen size for a phone to read it.
const ZOOM_MIN = 1;
const ZOOM_MAX = 6;
const ZOOM_DOUBLE_TAP = 2.5;

// Distance between two pointers, for pinch scaling.
function pinchDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// The full-screen page-image view. It supports pinch-to-zoom and one-finger pan
// on touch, double-tap to zoom in and back out, and a mouse-wheel zoom, so the
// Vilna page reads on a phone. The close control and the edition caption stay
// in view at every zoom level.
function Lightbox({ image, onClose }) {
  const surfaceRef = useRef(null);
  const closeButtonRef = useRef(null);
  const dialogRef = useRef(null);
  const priorFocusRef = useRef(
    typeof document !== 'undefined' ? document.activeElement : null
  );
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);

  // Move focus to the close button when the lightbox mounts.
  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      if (closeButtonRef.current) closeButtonRef.current.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  // Restore focus to the opener when the lightbox unmounts.
  useEffect(() => {
    const prior = priorFocusRef.current;
    return () => {
      if (prior && typeof prior.focus === 'function') prior.focus();
    };
  }, []);

  // Escape closes; Tab is trapped inside the dialog.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = dialog.querySelectorAll(
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
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Active pointers, the pinch baseline, the pan baseline, and the last tap
  // time, all held in a ref so the gesture handlers do not re-run on render.
  const gesture = useRef({
    pointers: new Map(),
    pinchStartDist: 0,
    pinchStartScale: 1,
    panStart: null,
    lastTapAt: 0,
  });

  // Clamp the pan so the image cannot be dragged entirely off screen.
  const clampPan = useCallback(
    (nextScale, x, y) => {
      const el = surfaceRef.current;
      if (!el) return { x, y };
      const rect = el.getBoundingClientRect();
      const overflowX = (rect.width * (nextScale - 1)) / 2;
      const overflowY = (rect.height * (nextScale - 1)) / 2;
      return {
        x: Math.max(-overflowX, Math.min(overflowX, x)),
        y: Math.max(-overflowY, Math.min(overflowY, y)),
      };
    },
    []
  );

  const resetView = useCallback(() => {
    setScale(1);
    setTx(0);
    setTy(0);
  }, []);

  function onPointerDown(e) {
    const g = gesture.current;
    g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);

    if (g.pointers.size === 2) {
      const [p1, p2] = [...g.pointers.values()];
      g.pinchStartDist = pinchDistance(p1, p2);
      g.pinchStartScale = scale;
      g.panStart = null;
    } else if (g.pointers.size === 1) {
      g.panStart = { x: e.clientX, y: e.clientY, tx, ty };

      // Double-tap toggles between fit and a comfortable reading zoom.
      const now = Date.now();
      if (now - g.lastTapAt < 300) {
        if (scale > 1.01) {
          resetView();
        } else {
          setScale(ZOOM_DOUBLE_TAP);
        }
        g.lastTapAt = 0;
      } else {
        g.lastTapAt = now;
      }
    }
  }

  function onPointerMove(e) {
    const g = gesture.current;
    if (!g.pointers.has(e.pointerId)) return;
    g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (g.pointers.size === 2 && g.pinchStartDist > 0) {
      const [p1, p2] = [...g.pointers.values()];
      const dist = pinchDistance(p1, p2);
      const nextScale = Math.max(
        ZOOM_MIN,
        Math.min(ZOOM_MAX, (g.pinchStartScale * dist) / g.pinchStartDist)
      );
      setScale(nextScale);
      const clamped = clampPan(nextScale, tx, ty);
      setTx(clamped.x);
      setTy(clamped.y);
    } else if (g.pointers.size === 1 && g.panStart && scale > 1) {
      const dx = e.clientX - g.panStart.x;
      const dy = e.clientY - g.panStart.y;
      const clamped = clampPan(scale, g.panStart.tx + dx, g.panStart.ty + dy);
      setTx(clamped.x);
      setTy(clamped.y);
    }
  }

  function endPointer(e) {
    const g = gesture.current;
    g.pointers.delete(e.pointerId);
    if (g.pointers.size < 2) {
      g.pinchStartDist = 0;
    }
    if (g.pointers.size === 0) {
      g.panStart = null;
    }
  }

  function onWheel(e) {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    const nextScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, scale + delta));
    setScale(nextScale);
    const clamped = clampPan(nextScale, tx, ty);
    setTx(clamped.x);
    setTy(clamped.y);
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Page image, ${image.label}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex',
        flexDirection: 'column',
        padding: 'var(--space-md)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-sm)' }}>
        <button
          type="button"
          className="pill-button"
          onClick={resetView}
          disabled={scale <= 1.01}
          aria-label="Reset zoom"
        >
          Reset zoom
        </button>
        <button
          ref={closeButtonRef}
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label="Close image"
        >
          <X size={22} />
        </button>
      </div>

      <div
        ref={surfaceRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onWheel={onWheel}
        style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          touchAction: 'none',
          cursor: scale > 1 ? 'grab' : 'default',
        }}
      >
        <img
          src={image.imageUrl}
          alt={`Talmud page, ${image.label}`}
          draggable={false}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            height: 'auto',
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: (prefersReducedMotion || gesture.current.pointers.size > 0) ? 'none' : 'transform 0.12s ease-out',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        />
      </div>

      <p
        style={{
          color: '#FFFFFF',
          textAlign: 'center',
          margin: 'var(--space-sm) 0 0',
        }}
      >
        {image.label}
      </p>
      <p
        style={{
          color: '#9CA3AF',
          textAlign: 'center',
          margin: 'var(--space-xs) 0 0',
          fontSize: '0.85rem',
        }}
      >
        Pinch or double-tap to zoom. Drag to move the page.
      </p>
    </div>
  );
}

function Amud({
  label,
  amudName,
  amud,
  view,
  heSize,
  enSize,
  showTranslit,
  onWordTap,
  daf,
}) {
  const count = Math.max(amud.he.length, amud.en.length);
  const segments = Array.from({ length: count }, (_, i) => i);

  // Sefaria addresses each segment of an amud by a one-based index appended to
  // the amud ref: "Chullin 44a" becomes "Chullin 44a:1" for the first segment.
  const amudRef = amud.ref || '';

  return (
    <section style={{ marginBottom: 'var(--space-2xl)' }}>
      <h2>
        <span className="hebrew" style={{ marginRight: '0.5rem' }}>
          {label}
        </span>
        {amudName}
      </h2>
      {amud.heRef && (
        <p className="hebrew" style={{ color: 'var(--accent-2)', marginTop: 0 }}>
          {amud.heRef}
        </p>
      )}

      <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {segments.map((i) => {
          const he = amud.he[i] || '';
          const en = amud.en[i] || '';
          // The line before and the line after, given to the partner as context
          // so it can read this line in its place without being handed the whole
          // daf. Labels are one-based, matching the segment numbering.
          const neighbors = {
            prev:
              i > 0
                ? {
                    label: `${amudName} ${i}`,
                    he: amud.he[i - 1] || '',
                    en: amud.en[i - 1] || '',
                  }
                : null,
            next:
              i < count - 1
                ? {
                    label: `${amudName} ${i + 2}`,
                    he: amud.he[i + 1] || '',
                    en: amud.en[i + 1] || '',
                  }
                : null,
          };
          return (
            <Segment
              key={i}
              index={i}
              amudRef={amudRef}
              amudName={amudName}
              he={he}
              en={en}
              view={view}
              heSize={heSize}
              enSize={enSize}
              showTranslit={showTranslit}
              onWordTap={onWordTap}
              daf={daf}
              neighbors={neighbors}
            />
          );
        })}
      </ol>
    </section>
  );
}

// One line of the daf as an interactive unit. It renders the Hebrew (tappable
// for pronunciation and meaning), the optional transliteration, the English, and
// the compare-translations control, then a quiet invitation to discuss the line.
// Discussing it opens the per-line partner inline. A stop is never forced: every
// line can be taken up and none must be. When a line is taken up, its
// transliteration shows even if the page-wide toggle is off, because that is the
// moment the reader wants to sound it out.
function Segment({
  index,
  amudRef,
  amudName,
  he,
  en,
  view,
  heSize,
  enSize,
  showTranslit,
  onWordTap,
  daf,
  neighbors,
}) {
  const [open, setOpen] = useState(false);

  if (!he && !en) return null;

  const segmentRef = amudRef ? `${amudRef}:${index + 1}` : '';
  const segmentLabel = `${amudName} ${index + 1}`;
  const showHebrew = view === 'both' || view === 'hebrew';
  const showEnglish = view === 'both' || view === 'english';

  // The line shows transliteration when the page toggle is on, or whenever the
  // line is taken up.
  const showLineTranslit = showTranslit || open;

  return (
    <li
      style={{
        padding: 'var(--space-md) 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {showHebrew && he && (
        <TappableHebrew
          html={he}
          fontSize={heSize}
          onWordTap={onWordTap}
          showTranslit={showLineTranslit}
        />
      )}
      {showEnglish && en && (
        <p
          style={{
            fontFamily: 'var(--font-accent)',
            fontSize: `${enSize}px`,
            lineHeight: 1.7,
            margin: view === 'both' ? 'var(--space-sm) 0 0' : 0,
            color: 'var(--text)',
          }}
        >
          {en}
        </p>
      )}
      {showEnglish && en && segmentRef && (
        <TranslationCompare
          segmentRef={segmentRef}
          defaultEn={en}
          enSize={enSize}
        />
      )}

      <div style={{ marginTop: 'var(--space-sm)' }}>
        <button
          type="button"
          className={open ? 'pill-button pill-button--active' : 'pill-button'}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={open ? `line-${segmentRef}` : undefined}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <MessageSquare size={16} aria-hidden="true" />
          {open ? 'Close this line' : 'Discuss this line'}
        </button>
      </div>

      {open && (
        <div id={`line-${segmentRef}`}>
          <LineHavruta
            daf={daf}
            segmentRef={segmentRef}
            segmentLabel={segmentLabel}
            he={he}
            en={en}
            neighbors={neighbors}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </li>
  );
}

function ReadingGate({ reading, setReading, submitted, onSubmit, daf, text }) {
  return (
    <section style={{ marginTop: 'var(--space-2xl)' }}>
      <h2>Step back: your reading of the whole page</h2>
      <p style={{ color: 'var(--muted)' }}>
        You take up lines one at a time as you read above. When you want to pull
        the page together, write your reading of the whole sugya here and your
        havruta challenges the whole of it. This is the closing step, not the way
        in: the line-by-line work above is the heart of it. As ever, you write
        first, and the partner challenges what you wrote rather than handing you
        an answer.
      </p>

      <label htmlFor="reading" className="sr-only">
        Your reading of this daf
      </label>
      <textarea
        id="reading"
        value={reading}
        onChange={(e) => setReading(e.target.value)}
        placeholder="Pull the page together: what is the sugya as a whole doing? Write your reading of the whole of it."
        rows={6}
        readOnly={submitted}
        style={{
          width: '100%',
          padding: 'var(--space-md)',
          fontFamily: 'var(--font-body)',
          fontSize: '1rem',
          lineHeight: 1.6,
          color: 'var(--text)',
          background: 'var(--bg-soft)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          resize: 'vertical',
          opacity: submitted ? 0.7 : 1,
        }}
      />
      {!submitted && (
        <div style={{ marginTop: 'var(--space-sm)' }}>
          <button
            type="button"
            className="pill-button pill-button--active"
            onClick={onSubmit}
            disabled={reading.trim().length === 0}
          >
            Submit my reading
          </button>
        </div>
      )}

      {submitted ? (
        <Havruta daf={daf} text={text} reading={reading} />
      ) : (
        <div className="card" style={{ marginTop: 'var(--space-lg)', opacity: 0.6 }} aria-disabled="true">
          <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Lock size={18} aria-hidden="true" />
            Your havruta
          </h3>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            This whole-page partner stays locked until you write your reading of
            the page above and submit it. You can also take up single lines
            higher on the page without coming down here.
          </p>
        </div>
      )}
    </section>
  );
}
