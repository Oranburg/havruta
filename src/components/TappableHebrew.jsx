import { memo } from 'react';
import { transliterate } from '../lib/transliterate.js';

// Render a Hebrew or Aramaic line as individually tappable words.
//
// Two modes. By default the line reads as flowing text, right to left, with each
// word a tappable lookup target and the original spacing preserved. When
// showTranslit is set, the line renders interlinear: each word becomes a small
// two-row column with its transliteration above it and the Hebrew word below, so
// the romanization sits directly over the word it belongs to. The Hebrew still
// reads right to left and still wraps like text, and each word stays tappable.
//
// The affordance matches Seth's other sites: a dashed underline under the word
// and a help cursor on hover, so a reader on a mouse sees the word is a lookup
// and a reader on a phone can tap it.

// Strip HTML tags and decode the few entities Sefaria's text uses, matching the
// data layer's own stripping so the words read as plain Hebrew.
function toPlainText(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

// Split a line into an ordered list of tokens, keeping the whitespace runs as
// their own tokens so they can render as plain text between the tappable words.
function tokenize(text) {
  return text.split(/(\s+)/).filter((t) => t.length > 0);
}

function isSpace(token) {
  return /^\s+$/.test(token);
}

// The transliteration of a single word in a given scheme, cached. transliterate
// is pure and the same words recur all over a daf, so a module-level cache makes
// the interlinear render cheap even on a long page. The cache is keyed by scheme
// and word so switching schemes does not return a stale romanization.
const translitCache = new Map();
function sayWord(word, schemeId) {
  const key = `${schemeId}|${word}`;
  if (translitCache.has(key)) return translitCache.get(key);
  const t = transliterate(word, schemeId);
  translitCache.set(key, t);
  return t;
}

// One tappable Hebrew word, shared by both modes.
function wordHandlers(word, onWordTap) {
  return {
    role: 'button',
    tabIndex: 0,
    onClick: (e) => onWordTap(word, e.currentTarget),
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onWordTap(word, e.currentTarget);
      }
    },
    style: wordStyle,
    title: 'Look this word up',
  };
}

function TappableHebrew({
  html,
  fontSize,
  onWordTap,
  showTranslit = false,
  scheme = 'academic',
}) {
  const plain = toPlainText(html);
  if (!plain) return null;

  // Interlinear mode: word-over-word transliteration in the chosen scheme.
  if (showTranslit) {
    const words = plain.split(/\s+/).filter(Boolean);
    const translitSize = Math.max(11, Math.round(fontSize * 0.5));
    return (
      <div
        className="hebrew"
        dir="rtl"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          rowGap: '0.4em',
          columnGap: '0.5em',
          fontSize: `${fontSize}px`,
          lineHeight: 1.25,
          margin: 0,
        }}
      >
        {words.map((word, i) => {
          const t = sayWord(word, scheme);
          // A real transliteration differs from the source; a punctuation or
          // number token comes back unchanged and gets a blank slot below it so
          // the Hebrew line stays even across the row.
          const hasT = Boolean(t) && t !== word;
          return (
            <span
              key={i}
              style={{
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <span {...wordHandlers(word, onWordTap)}>{word}</span>
              <span
                dir="ltr"
                aria-hidden="true"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: `${translitSize}px`,
                  lineHeight: 1.2,
                  color: 'var(--muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                {hasT ? t : ' '}
              </span>
            </span>
          );
        })}
      </div>
    );
  }

  // Default mode: flowing line with preserved spacing.
  const tokens = tokenize(plain);
  return (
    <p
      className="hebrew"
      style={{ fontSize: `${fontSize}px`, lineHeight: 1.9, margin: 0 }}
    >
      {tokens.map((token, i) => {
        if (isSpace(token)) {
          return <span key={i}>{token}</span>;
        }
        return (
          <span key={i} {...wordHandlers(token, onWordTap)}>
            {token}
          </span>
        );
      })}
    </p>
  );
}

// Memoized so a word-popover open (which re-renders the page) does not rebuild
// every line's interlinear columns. The props are stable: html and fontSize
// change rarely, onWordTap is a stable callback, showTranslit changes on toggle.
export default memo(TappableHebrew);

// The house affordance: a dashed underline and a help cursor, so the word reads
// as a lookup on a mouse and as a tap target on a phone.
const wordStyle = {
  cursor: 'help',
  textDecoration: 'underline',
  textDecorationStyle: 'dashed',
  textDecorationThickness: '1px',
  textUnderlineOffset: '0.22em',
  textDecorationColor: 'var(--border)',
  padding: '0 0.04em',
  borderRadius: 'var(--radius-sm)',
};
