import { useMemo, useState } from 'react';
import { ChevronLeft, Trash2, Search } from 'lucide-react';
import { listSessions, deleteSession } from '../lib/sessions.js';

const HEBREW_RANGE = /[֐-׿יִ-ﭏ]/;

// Render a stored message turn. The partner may quote Hebrew in Hebrew
// characters; tag Hebrew runs with the .hebrew helper so they read right to
// left in the Hebrew font.
function renderText(text) {
  const parts = String(text).split(/(\s*[֐-׿יִ-ﭏ][֐-׿יִ-ﭏ\s֑-ׇ"'.,:;()־-]*)/g);
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

function formatDate(ms) {
  if (!ms) return '';
  try {
    return new Date(ms).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function Archive() {
  // Snapshot the list once on render; deletes refresh it through state.
  const [sessions, setSessions] = useState(() => listSessions());
  const [openId, setOpenId] = useState(null);
  const [query, setQuery] = useState('');

  const open = openId ? sessions.find((s) => s.id === openId) : null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) => {
      const daf = (s.dafDisplay || s.dafRef || '').toLowerCase();
      const date = formatDate(s.savedAt).toLowerCase();
      return daf.includes(q) || date.includes(q);
    });
  }, [sessions, query]);

  function remove(id) {
    deleteSession(id);
    setSessions(listSessions());
    if (openId === id) setOpenId(null);
  }

  // The reopened view of one session.
  if (open) {
    return (
      <section>
        <button
          type="button"
          className="pill-button"
          onClick={() => setOpenId(null)}
          style={{ marginBottom: 'var(--space-md)' }}
        >
          <ChevronLeft size={18} /> Back to archive
        </button>

        <h1>{open.dafDisplay || open.dafRef}</h1>
        <p style={{ color: 'var(--muted)', marginTop: 0 }}>
          {formatDate(open.savedAt)}
        </p>

        <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {open.messages.map((m, i) => {
            const isReader = m.role === 'user';
            return (
              <li
                key={i}
                className="card"
                style={{
                  marginBottom: 'var(--space-md)',
                  background: isReader ? 'var(--bg-soft)' : 'var(--bg-secondary)',
                }}
              >
                <p
                  style={{
                    margin: '0 0 var(--space-xs)',
                    fontSize: '0.78rem',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: isReader ? 'var(--muted)' : 'var(--accent)',
                  }}
                >
                  {isReader ? 'You' : 'Havruta'}
                </p>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                  {renderText(m.content)}
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    );
  }

  // The list of saved sessions.
  return (
    <section>
      <h1>Archive</h1>
      <p style={{ color: 'var(--muted)' }}>
        Your saved study sessions: the daf, your reading, the partner&rsquo;s
        challenges, and your responses. The record stays on your device and
        becomes a transcript of how you learned to read. Each session is kept
        whole, including the challenges your reading overcame.
      </p>

      {sessions.length === 0 ? (
        <div className="card">
          <p style={{ margin: 0 }}>
            Nothing saved yet. Read today&rsquo;s daf, write your reading, and
            study with the partner. The exchange lands here.
          </p>
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              marginBottom: 'var(--space-lg)',
            }}
          >
            <Search size={18} aria-hidden="true" style={{ color: 'var(--muted)' }} />
            <label htmlFor="archive-search" className="sr-only">
              Search by daf or date
            </label>
            <input
              id="archive-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by daf or date"
              style={{
                flex: 1,
                padding: 'var(--space-sm) var(--space-md)',
                fontFamily: 'var(--font-body)',
                fontSize: '1rem',
                color: 'var(--text)',
                background: 'var(--bg-soft)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
              }}
            />
          </div>

          <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {filtered.map((s) => (
              <li
                key={s.id}
                className="card"
                style={{
                  marginBottom: 'var(--space-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-md)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenId(s.id)}
                  style={{
                    flex: 1,
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      fontFamily: 'var(--font-headline)',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      color: 'var(--accent)',
                    }}
                  >
                    {s.dafDisplay || s.dafRef}
                  </span>
                  <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                    {formatDate(s.savedAt)}
                  </span>
                </button>
                <button
                  type="button"
                  className="icon-button icon-button--sm"
                  onClick={() => remove(s.id)}
                  aria-label={`Delete the session for ${s.dafDisplay || s.dafRef}`}
                >
                  <Trash2 size={18} />
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li style={{ color: 'var(--muted)' }}>
                No saved session matches that search.
              </li>
            )}
          </ol>
        </>
      )}
    </section>
  );
}
