import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { lookupWord, sefariaUrl } from '../lib/sefaria.js';
import { transliterate } from '../lib/transliterate.js';

// A dismissible lexicon popover anchored to a tapped Hebrew or Aramaic word.
// It calls lookupWord and shows what Sefaria's dictionaries carry, verbatim:
// the dictionary headword, the source dictionary named, and the range of senses
// as Sefaria gives them. When the word has no entry, it says so plainly and
// still offers a Sefaria link so the reader can search the word there. Nothing
// is ever invented; on a lookup failure the popover reports the failure.
//
// On a phone the popover renders as a bottom sheet, which is easier to read and
// dismiss with a thumb. On a wider screen it anchors near the tapped word. Only
// one popover is open at a time; the parent controls that by mounting one.
//
// Props:
//   word:    the exact word string the reader tapped (verbatim from the page).
//   anchor:  a DOMRect of the tapped word, used to position the desktop popover.
//   onClose: called when the reader dismisses the popover.
export default function WordPopover({ word, anchor, onClose }) {
  const [state, setState] = useState({ status: 'loading', result: null, error: null });
  const cardRef = useRef(null);
  const closeButtonRef = useRef(null);
  const [pos, setPos] = useState(null);

  // Remember what had focus before the popover opened so we can restore it.
  const priorFocusRef = useRef(
    typeof document !== 'undefined' ? document.activeElement : null
  );

  // A phone gets the bottom sheet; a wider screen gets the anchored popover.
  // matchMedia is a standard web API and works inside a Capacitor wrap.
  const [isPhone, setIsPhone] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(max-width: 640px)').matches
      : false
  );
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(max-width: 640px)');
    const onChange = (e) => setIsPhone(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Look the word up once when the popover opens.
  useEffect(() => {
    let live = true;
    setState({ status: 'loading', result: null, error: null });
    lookupWord(word)
      .then((result) => {
        if (!live) return;
        setState({ status: 'done', result, error: null });
      })
      .catch((err) => {
        if (!live) return;
        setState({
          status: 'error',
          result: null,
          error: err instanceof Error ? err.message : 'The lookup did not complete.',
        });
      });
    return () => {
      live = false;
    };
  }, [word]);

  // Move focus to the close button when the popover mounts.
  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      if (closeButtonRef.current) closeButtonRef.current.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  // Restore focus to the element that opened the popover when it unmounts.
  useEffect(() => {
    const prior = priorFocusRef.current;
    return () => {
      if (prior && typeof prior.focus === 'function') prior.focus();
    };
  }, []);

  // Escape closes; Tab is trapped inside the card.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const card = cardRef.current;
      if (!card) return;
      const focusable = card.querySelectorAll(
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

  // Place the desktop popover near the tapped word, kept inside the viewport.
  useLayoutEffect(() => {
    if (isPhone || !anchor || !cardRef.current) {
      setPos(null);
      return;
    }
    const card = cardRef.current.getBoundingClientRect();
    const margin = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Prefer below the word; flip above when there is no room below.
    let top = anchor.bottom + margin;
    if (top + card.height > vh - margin) {
      top = Math.max(margin, anchor.top - card.height - margin);
    }
    // Center on the word horizontally, then clamp to the viewport.
    let left = anchor.left + anchor.width / 2 - card.width / 2;
    left = Math.max(margin, Math.min(left, vw - card.width - margin));
    setPos({ top, left });
  }, [isPhone, anchor, state.status]);

  const found = state.status === 'done' && state.result && state.result.found;
  const headwordForLink =
    state.result && state.result.word ? state.result.word : word;

  // How to say the word: the rule-based transliteration of the tapped word. This
  // is the sounding-out help a partner gives first, before the meaning. It shows
  // only when it produces something other than the bare Hebrew (an unpointed or
  // punctuation-only token yields nothing useful, and is left out rather than
  // shown empty).
  const say = transliterate(word);
  const hasSay = Boolean(say) && say !== word;

  const card = (
    <div
      ref={cardRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Dictionary for ${word}`}
      style={isPhone ? sheetCardStyle : { ...popoverCardStyle, ...(pos || hiddenUntilPlaced) }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={headerRow}>
        <span
          className="hebrew"
          style={{ fontSize: '1.5rem', color: 'var(--accent-2)', fontWeight: 500 }}
        >
          {word}
        </span>
        <button
          ref={closeButtonRef}
          type="button"
          className="icon-button icon-button--sm"
          onClick={onClose}
          aria-label="Close dictionary"
        >
          <X size={18} />
        </button>
      </div>

      {hasSay && (
        <p style={pronounceLine}>
          <span style={{ color: 'var(--muted)' }}>Say it: </span>
          <span dir="ltr" style={{ color: 'var(--text)' }}>
            {say}
          </span>
        </p>
      )}

      {state.status === 'loading' && (
        <p style={mutedLine}>Looking this word up in Sefaria&rsquo;s dictionaries. One moment.</p>
      )}

      {state.status === 'error' && (
        <p style={mutedLine}>
          The dictionary lookup could not reach Sefaria right now, so there is
          nothing to show for this word. {state.error}
        </p>
      )}

      {state.status === 'done' && !found && (
        <p style={mutedLine}>
          Sefaria&rsquo;s dictionaries carry no entry for this word under the
          forms tried. You can still look it up on Sefaria.
        </p>
      )}

      {found && (
        <div>
          {state.result.entries.map((entry, ei) => (
            <div
              key={`${entry.lexicon}-${ei}`}
              style={{ marginBottom: ei < state.result.entries.length - 1 ? 'var(--space-md)' : 0 }}
            >
              <div style={entryHead}>
                <span
                  className="hebrew"
                  style={{ fontSize: '1.25rem', color: 'var(--text)', fontWeight: 500 }}
                >
                  {entry.headword}
                </span>
                <span style={lexiconTag}>{entry.lexicon}</span>
              </div>
              <ol style={senseList}>
                {entry.senses.map((sense, si) => (
                  <li key={si} style={senseItem}>
                    {sense}
                  </li>
                ))}
              </ol>
            </div>
          ))}
          <p style={chooseLine}>
            The English on the page chose one of these senses. The Aramaic holds
            the rest.
          </p>
        </div>
      )}

      <a
        href={sefariaUrl(headwordForLink)}
        target="_blank"
        rel="noopener noreferrer"
        style={sefariaLink}
      >
        Look it up on Sefaria <ExternalLink size={15} aria-hidden="true" />
      </a>
    </div>
  );

  return (
    <div
      style={isPhone ? sheetScrimStyle : popoverScrimStyle}
      onClick={onClose}
      // The scrim sits above the page so a tap outside the card dismisses it.
    >
      {card}
    </div>
  );
}

// The desktop popover floats above the page over a transparent scrim that only
// catches the dismiss tap. The phone sheet darkens the page behind it.
const popoverScrimStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 60,
  background: 'transparent',
};

const sheetScrimStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 60,
  background: 'rgba(0,0,0,0.45)',
  display: 'flex',
  alignItems: 'flex-end',
};

const popoverCardStyle = {
  position: 'fixed',
  width: 'min(360px, calc(100vw - 16px))',
  maxHeight: '60vh',
  overflowY: 'auto',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  boxShadow: '0 8px 28px rgba(0,0,0,0.45)',
  padding: 'var(--space-md)',
};

// Until the layout effect measures and places the card, keep it off screen so
// the reader never sees it flash in the wrong spot.
const hiddenUntilPlaced = { top: -9999, left: -9999 };

const sheetCardStyle = {
  position: 'relative',
  width: '100%',
  maxHeight: '80vh',
  overflowY: 'auto',
  background: 'var(--bg-secondary)',
  borderTop: '1px solid var(--border)',
  borderTopLeftRadius: 'var(--radius-md)',
  borderTopRightRadius: 'var(--radius-md)',
  boxShadow: '0 -8px 28px rgba(0,0,0,0.45)',
  padding: 'var(--space-md)',
  paddingBottom: 'calc(var(--space-md) + env(safe-area-inset-bottom, 0px))',
};

const headerRow = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--space-sm)',
  marginBottom: 'var(--space-sm)',
};

const entryHead = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 'var(--space-sm)',
  marginBottom: 'var(--space-xs)',
};

const lexiconTag = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.78rem',
  color: '#000000',
  background: 'var(--accent-2)',
  borderRadius: 'var(--radius-pill)',
  padding: '0.1rem 0.6rem',
  whiteSpace: 'nowrap',
};

const senseList = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  fontFamily: 'var(--font-accent)',
};

const senseItem = {
  fontSize: '1.02rem',
  lineHeight: 1.55,
  color: 'var(--text)',
  paddingBottom: 'var(--space-xs)',
};

const chooseLine = {
  fontSize: '0.85rem',
  color: 'var(--muted)',
  margin: 'var(--space-sm) 0 0',
};

const mutedLine = {
  color: 'var(--muted)',
  margin: 0,
};

const pronounceLine = {
  fontFamily: 'var(--font-body)',
  fontSize: '1.05rem',
  margin: '0 0 var(--space-sm)',
  paddingBottom: 'var(--space-sm)',
  borderBottom: '1px solid var(--border)',
};

const sefariaLink = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.3rem',
  marginTop: 'var(--space-md)',
  fontSize: '0.95rem',
  color: 'var(--accent)',
};
