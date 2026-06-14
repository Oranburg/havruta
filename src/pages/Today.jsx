import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  X,
  Lock,
  MessageSquare,
  ArrowDown,
} from 'lucide-react';
import { getTodaysDaf, getDafText, getDafImages } from '../lib/sefaria.js';
import { KEY_STORAGE } from '../lib/partner.js';
import Havruta from '../components/Havruta.jsx';

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

export default function Today() {
  const [daf, setDaf] = useState(null);
  const [text, setText] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [view, setView] = useState('both');
  const [heSize, setHeSize] = useState(26);
  const [enSize, setEnSize] = useState(18);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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

  useEffect(() => {
    load(null);
  }, [load]);

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

  return (
    <section>
      <Header daf={daf} />

      <PartnerIntro submitted={readingSubmitted} />

      <DafNav prevDaf={prevDaf} nextDaf={nextDaf} onGo={load} />

      <Controls
        view={view}
        setView={setView}
        heSize={heSize}
        setHeSize={setHeSize}
        enSize={enSize}
        setEnSize={setEnSize}
      />

      {images.length > 0 && (
        <PageImage image={images[0]} onOpen={() => setLightboxOpen(true)} />
      )}

      {text && (
        <>
          <Amud
            label="א"
            amudName="Amud a"
            amud={text.a}
            view={view}
            heSize={heSize}
            enSize={enSize}
          />
          <Amud
            label="ב"
            amudName="Amud b"
            amud={text.b}
            view={view}
            heSize={heSize}
            enSize={enSize}
          />
        </>
      )}

      <DafNav prevDaf={prevDaf} nextDaf={nextDaf} onGo={load} />

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
    </section>
  );
}

function Header({ daf }) {
  return (
    <header style={{ marginBottom: 'var(--space-md)' }}>
      <h1 style={{ marginBottom: 'var(--space-xs)' }}>{daf.displayEn}</h1>
      {daf.displayHe && (
        <p
          className="hebrew"
          style={{ fontSize: '1.4rem', color: 'var(--accent-2)', margin: 0 }}
        >
          {daf.displayHe}
        </p>
      )}
    </header>
  );
}

function hasSavedKey() {
  try {
    return Boolean(localStorage.getItem(KEY_STORAGE));
  } catch {
    return false;
  }
}

function scrollToReading() {
  const el = document.getElementById('reading');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.focus({ preventScroll: true });
  }
}

// Makes the study partner obvious from the first look. With no key saved it
// invites the one setup step; with a key it points the reader to write first.
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
          explaining the daf. It runs on Claude with your own Anthropic key, kept
          only on this device. Add your key once to begin.
        </p>
        <Link to="/settings" className="pill-button pill-button--active">
          Add your key in Settings
        </Link>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
      <p style={{ margin: '0 0 var(--space-sm)' }}>
        Read the page, then write your own reading. Your havruta challenges what
        you wrote; it does not hand you the answer.
      </p>
      <button type="button" className="pill-button" onClick={scrollToReading}>
        <ArrowDown size={18} /> Write my reading
      </button>
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

function Controls({ view, setView, heSize, setHeSize, enSize, setEnSize }) {
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

function Lightbox({ image, onClose }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Page image, ${image.label}`}
      onClick={onClose}
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
      <button
        type="button"
        className="icon-button"
        onClick={onClose}
        aria-label="Close image"
        style={{ alignSelf: 'flex-end' }}
      >
        <X size={22} />
      </button>
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={image.imageUrl}
          alt={`Talmud page, ${image.label}`}
          style={{ maxWidth: '100%', height: 'auto' }}
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
    </div>
  );
}

function Amud({ label, amudName, amud, view, heSize, enSize }) {
  const count = Math.max(amud.he.length, amud.en.length);
  const segments = Array.from({ length: count }, (_, i) => i);

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
          return (
            <li
              key={i}
              style={{
                padding: 'var(--space-md) 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              {(view === 'both' || view === 'hebrew') && he && (
                <p
                  className="hebrew"
                  style={{ fontSize: `${heSize}px`, lineHeight: 1.9, margin: 0 }}
                  dangerouslySetInnerHTML={{ __html: he }}
                />
              )}
              {(view === 'both' || view === 'english') && en && (
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
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function ReadingGate({ reading, setReading, submitted, onSubmit, daf, text }) {
  return (
    <section style={{ marginTop: 'var(--space-2xl)' }}>
      <h2>Your reading comes first</h2>
      <p style={{ color: 'var(--muted)' }}>
        Read the page and write your own reading, question, or attempt to
        paraphrase it before the partner says anything. Acting first is the
        point. The partner challenges what you wrote; it does not hand you an
        answer.
      </p>

      <label htmlFor="reading" className="sr-only">
        Your reading of this daf
      </label>
      <textarea
        id="reading"
        value={reading}
        onChange={(e) => setReading(e.target.value)}
        placeholder="What do you make of this page? Write your reading, a question it raises, or your best attempt to say what it means."
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
            This panel stays locked until you write your own reading above and
            submit it. The partner becomes reachable only after you have
            committed a reading of your own.
          </p>
        </div>
      )}
    </section>
  );
}
