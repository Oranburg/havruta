import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { getDafLinks } from '../lib/sefaria.js';
import SefariaText from './SefariaText.jsx';

// The classic commentators that sit around the daf, shown beside the page and
// collapsed by default so the reader chooses how much help to open. The list is
// whatever Sefaria actually carries for this daf (commonly Rashi and Tosafot,
// plus others present). Each commentator expands to its text, verbatim from
// Sefaria, in Hebrew or Aramaic with English alongside when Sefaria carries it.
export default function Commentaries({ dafRef, heSize, enSize }) {
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openName, setOpenName] = useState(null);

  // Load the links the first time the section opens, then keep them.
  useEffect(() => {
    if (!open || groups || loading) return;
    let live = true;
    setLoading(true);
    setError(null);
    getDafLinks(dafRef)
      .then((result) => {
        if (!live) return;
        setGroups(result);
        setLoading(false);
      })
      .catch((err) => {
        if (!live) return;
        setError(err instanceof Error ? err.message : 'Something went wrong.');
        setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [open, groups, loading, dafRef]);

  const commentary = groups ? groups.commentary : [];

  return (
    <section style={{ marginTop: 'var(--space-2xl)' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={sectionToggleStyle}
      >
        {open ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        <span style={{ fontFamily: 'var(--font-headline)', fontSize: '1.3rem' }}>
          Commentaries
        </span>
      </button>

      {open && (
        <div style={{ marginTop: 'var(--space-md)' }}>
          <p style={{ color: 'var(--muted)', marginTop: 0 }}>
            These are the commentators Sefaria carries on this daf. Open one to
            read its words on the page.
          </p>

          {loading && (
            <p style={{ color: 'var(--muted)' }}>
              Loading the commentaries from Sefaria. One moment.
            </p>
          )}

          {error && (
            <p style={{ color: 'var(--muted)' }}>
              The commentaries could not be loaded from Sefaria right now, so
              there is nothing to show. {error}
            </p>
          )}

          {groups && commentary.length === 0 && !loading && (
            <p style={{ color: 'var(--muted)' }}>
              Sefaria lists no commentaries on this daf.
            </p>
          )}

          {commentary.map((work) => (
            <Commentator
              key={work.name}
              work={work}
              isOpen={openName === work.name}
              onToggle={() =>
                setOpenName((current) =>
                  current === work.name ? null : work.name
                )
              }
              heSize={heSize}
              enSize={enSize}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// One commentator: name in English and Hebrew, expanding to its text. A
// commentator may attach at several points on the daf; each attachment is its
// own ref, shown in order.
function Commentator({ work, isOpen, onToggle, heSize, enSize }) {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--space-sm)',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)',
          width: '100%',
          padding: 'var(--space-md)',
          background: isOpen ? 'var(--bg-soft)' : 'transparent',
          border: 'none',
          color: 'var(--text)',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        <span style={{ fontWeight: 500 }}>{work.name}</span>
        {work.heName && (
          <span
            className="hebrew"
            style={{ color: 'var(--accent-2)', marginInlineStart: 'auto' }}
          >
            {work.heName}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{ padding: '0 var(--space-md) var(--space-md)' }}>
          {work.refs.map((ref) => (
            <div key={ref} style={{ marginTop: 'var(--space-md)' }}>
              <SefariaText refToLoad={ref} heSize={heSize} enSize={enSize} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const sectionToggleStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-sm)',
  width: '100%',
  padding: 0,
  background: 'transparent',
  border: 'none',
  color: 'var(--accent)',
  cursor: 'pointer',
  textAlign: 'left',
};
