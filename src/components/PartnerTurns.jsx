// The visible conversation: the reader's turns and the partner's challenges, in
// order. Shared by the page-level partner and the per-line partner so a turn
// looks the same wherever it appears. Hebrew and Aramaic runs inside a partner
// turn get the Hebrew font and right-to-left direction.

const HEBREW_RANGE = /[֐-׿יִ-ﭏ]/;

// Split a partner turn into runs of Hebrew-bearing text and plain text so a
// quoted Hebrew phrase gets the Hebrew font and right-to-left direction.
function renderPartnerText(text) {
  const parts = text.split(/(\s*[֐-׿יִ-ﭏ][֐-׿יִ-ﭏ\s֑-ׇ"'.,:;()־-]*)/g);
  return parts.map((part, i) => {
    if (part && HEBREW_RANGE.test(part)) {
      return (
        <span key={i} className="hebrew" style={{ display: 'inline' }}>
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function PartnerTurns({ turns, streaming }) {
  return (
    <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {turns.map((turn, i) => (
        <li
          key={i}
          style={{
            marginBottom: 'var(--space-sm)',
            padding: 'var(--space-sm) var(--space-md)',
            borderRadius: 'var(--radius-md)',
            background:
              turn.role === 'reader' ? 'var(--bg-soft)' : 'transparent',
            border:
              turn.role === 'partner'
                ? '1px solid var(--border)'
                : '1px solid transparent',
          }}
        >
          <p
            style={{
              margin: '0 0 var(--space-xs)',
              fontSize: '0.78rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: turn.role === 'reader' ? 'var(--muted)' : 'var(--accent)',
            }}
          >
            {turn.role === 'reader' ? 'You' : 'Havruta'}
          </p>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
            {turn.role === 'partner'
              ? renderPartnerText(turn.text)
              : turn.text}
            {turn.pending && streaming && (
              <span aria-hidden="true" style={{ color: 'var(--muted)' }}>
                {' '}
                &hellip;
              </span>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
