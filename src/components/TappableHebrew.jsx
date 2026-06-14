// Render a Hebrew or Aramaic line as individually tappable words.
//
// Sefaria supplies the Hebrew with occasional HTML in it (a footnote marker, a
// span, a bold). The line on the page is read right to left in Hebrew letters,
// so this strips the markup to plain text, splits on whitespace into words, and
// renders each word as a tappable target. Tapping a word asks the parent to
// open the lexicon popover for that word, anchored to where it sits on the page.
//
// The affordance matches Seth's other sites: a dashed underline under the word
// and a help cursor on hover, so a reader on a mouse sees the word is a lookup
// and a reader on a phone can tap it. Whitespace between words is preserved as
// plain text so the line keeps its spacing and wraps naturally.

// Strip HTML tags and decode the few entities Sefaria's text uses, matching the
// data layer's own stripping so the words read as plain Hebrew. The data layer's
// stripHtml is not exported, so this repeats the same small transform here.
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
  // Split but keep the separators: even indices are words, odd are whitespace.
  return text.split(/(\s+)/).filter((t) => t.length > 0);
}

// A token is whitespace when it is only whitespace characters.
function isSpace(token) {
  return /^\s+$/.test(token);
}

export default function TappableHebrew({ html, fontSize, onWordTap }) {
  const plain = toPlainText(html);
  if (!plain) return null;
  const tokens = tokenize(plain);

  return (
    <p
      className="hebrew"
      style={{ fontSize: `${fontSize}px`, lineHeight: 1.9, margin: 0 }}
    >
      {tokens.map((token, i) => {
        if (isSpace(token)) {
          // Preserve the original spacing between words.
          return <span key={i}>{token}</span>;
        }
        return (
          <span
            key={i}
            role="button"
            tabIndex={0}
            onClick={(e) => onWordTap(token, e.currentTarget)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onWordTap(token, e.currentTarget);
              }
            }}
            style={wordStyle}
            title="Look this word up"
          >
            {token}
          </span>
        );
      })}
    </p>
  );
}

// The house affordance: a dashed underline and a help cursor, so the word reads
// as a lookup on a mouse and as a tap target on a phone.
const wordStyle = {
  cursor: 'help',
  textDecoration: 'underline',
  textDecorationStyle: 'dashed',
  textDecorationThickness: '1px',
  textUnderlineOffset: '0.22em',
  textDecorationColor: 'var(--border)',
  // A generous touch target without changing the line's look.
  padding: '0 0.04em',
  borderRadius: 'var(--radius-sm)',
};
