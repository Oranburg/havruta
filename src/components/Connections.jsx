import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { getDafLinks, getVerseCommentaries } from '../lib/sefaria.js';
import SefariaText from './SefariaText.jsx';

// The daf's links to the wider library, collapsed by default. The verses it
// cites (Tanakh), the halakhic codes that cite it (Mishneh Torah, Tur, Shulchan
// Arukh), parallel Talmud passages, and the rest. Tapping any connection opens
// the linked text verbatim from Sefaria in a panel, with a way to close.
//
// A cited Torah verse carries its own commentaries, Onkelos and Rashi among
// them. There is no Onkelos on the Talmud, so the panel for a Tanakh link
// offers the verse's own commentaries, fetched the same way; Onkelos appears
// there when the verse is in the Torah, and not otherwise.
const GROUPS = [
  { key: 'tanakh', heading: 'Verses the daf cites', kind: 'verse' },
  { key: 'halakhah', heading: 'Halakhic codes that cite the daf', kind: 'work' },
  { key: 'talmud', heading: 'Parallel Talmud passages', kind: 'work' },
  { key: 'quoting', heading: 'Works that quote this daf', kind: 'work' },
  { key: 'other', heading: 'Other references', kind: 'work' },
];

export default function Connections({ dafRef, heSize, enSize }) {
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // The open connection: { ref, kind } where kind 'verse' adds the verse's own
  // commentaries to the panel.
  const [panel, setPanel] = useState(null);

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

  const total = groups
    ? GROUPS.reduce((sum, g) => sum + groups[g.key].length, 0)
    : 0;

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
          Connections
        </span>
      </button>

      {open && (
        <div style={{ marginTop: 'var(--space-md)' }}>
          <p style={{ color: 'var(--muted)', marginTop: 0 }}>
            Where this daf reaches into the rest of the library. Tap a connection
            to read it on the page.
          </p>

          {loading && (
            <p style={{ color: 'var(--muted)' }}>
              Loading the connections from Sefaria. One moment.
            </p>
          )}

          {error && (
            <p style={{ color: 'var(--muted)' }}>
              The connections could not be loaded from Sefaria right now, so
              there is nothing to show. {error}
            </p>
          )}

          {groups && total === 0 && !loading && (
            <p style={{ color: 'var(--muted)' }}>
              Sefaria lists no connections for this daf.
            </p>
          )}

          {groups &&
            GROUPS.map((group) => {
              const items = groups[group.key];
              if (items.length === 0) return null;
              return (
                <div key={group.key} style={{ marginBottom: 'var(--space-lg)' }}>
                  <h3 style={{ marginBottom: 'var(--space-sm)' }}>
                    {group.heading}
                  </h3>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {items.map((item) =>
                      item.refs.map((ref) => (
                        <li key={ref} style={{ marginBottom: 'var(--space-xs)' }}>
                          <button
                            type="button"
                            className="pill-button"
                            onClick={() =>
                              setPanel({ ref, kind: group.kind })
                            }
                            style={{ maxWidth: '100%' }}
                          >
                            <span
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {ref}
                            </span>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              );
            })}
        </div>
      )}

      {panel && (
        <ConnectionPanel
          refToLoad={panel.ref}
          kind={panel.kind}
          heSize={heSize}
          enSize={enSize}
          onClose={() => setPanel(null)}
        />
      )}
    </section>
  );
}

// The full text of one connection, in a modal over the page. A verse connection
// also lists the verse's own commentaries, each of which expands in place.
function ConnectionPanel({ refToLoad, kind, heSize, enSize, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Connection, ${refToLoad}`}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 'var(--max-width)',
          maxHeight: '90dvh',
          overflowY: 'auto',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderTopLeftRadius: 'var(--radius-md)',
          borderTopRightRadius: 'var(--radius-md)',
          padding: 'var(--space-lg)',
          paddingBottom: 'calc(var(--space-lg) + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 'var(--space-sm)',
            marginBottom: 'var(--space-md)',
          }}
        >
          <h3 style={{ margin: 0 }}>{refToLoad}</h3>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close this connection"
          >
            <X size={22} />
          </button>
        </div>

        <SefariaText refToLoad={refToLoad} heSize={heSize} enSize={enSize} />

        {kind === 'verse' && (
          <VerseCommentaries
            verseRef={refToLoad}
            heSize={heSize}
            enSize={enSize}
          />
        )}
      </div>
    </div>
  );
}

// A cited verse's own commentaries (Onkelos and Rashi among them on a Torah
// verse). Loaded with the same links call the daf uses, so the reader follows
// the verse down into its commentary the way the page intends.
function VerseCommentaries({ verseRef, heSize, enSize }) {
  const [groups, setGroups] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openName, setOpenName] = useState(null);

  // A verse carries its own commentaries; load them through the verified
  // Sefaria client, which folds Onkelos (Targum) in with the commentary.
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(null);
    getVerseCommentaries(verseRef)
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
  }, [verseRef]);

  const commentary = groups || [];

  return (
    <div style={{ marginTop: 'var(--space-lg)' }}>
      <h3>Commentaries on this verse</h3>
      <p style={{ color: 'var(--muted)', marginTop: 0 }}>
        The verse carries its own commentators. Open one to read it.
      </p>

      {loading && (
        <p style={{ color: 'var(--muted)' }}>
          Loading the verse commentaries from Sefaria. One moment.
        </p>
      )}

      {error && (
        <p style={{ color: 'var(--muted)' }}>
          The verse commentaries could not be loaded from Sefaria right now, so
          there is nothing to show. {error}
        </p>
      )}

      {groups && commentary.length === 0 && !loading && (
        <p style={{ color: 'var(--muted)' }}>
          Sefaria lists no commentaries on this verse.
        </p>
      )}

      {commentary.map((work) => (
        <div
          key={work.name}
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-sm)',
            overflow: 'hidden',
          }}
        >
          <button
            type="button"
            onClick={() =>
              setOpenName((current) =>
                current === work.name ? null : work.name
              )
            }
            aria-expanded={openName === work.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              width: '100%',
              padding: 'var(--space-md)',
              background:
                openName === work.name ? 'var(--bg-soft)' : 'transparent',
              border: 'none',
              color: 'var(--text)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            {openName === work.name ? (
              <ChevronDown size={18} />
            ) : (
              <ChevronRight size={18} />
            )}
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

          {openName === work.name && (
            <div style={{ padding: '0 var(--space-md) var(--space-md)' }}>
              {work.refs.map((ref) => (
                <div key={ref} style={{ marginTop: 'var(--space-md)' }}>
                  <SefariaText refToLoad={ref} heSize={heSize} enSize={enSize} />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
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
