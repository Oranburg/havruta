import { useEffect, useState } from 'react';
import { Languages, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import {
  getTranslations,
  getTranslationText,
  sefariaUrl,
} from '../lib/sefaria.js';

// A per-segment control that shows the reader the English is a choice. The page
// shows one English rendering by default; this opens the other English versions
// Sefaria carries for the same segment, each labeled with its version name and
// quoted verbatim. When Sefaria has only one English version for the segment,
// it says that plainly. Every line of English comes from Sefaria; on a failure
// the panel reports the failure and shows nothing invented.
//
// Props:
//   segmentRef:  the exact Sefaria ref of this one segment (e.g. "Chullin 44a:3").
//   defaultEn:   the English the page is already showing for this segment, so the
//                panel can mark which version is the default and not repeat it.
//   enSize:      the reader's chosen English type size, in pixels.
export default function TranslationCompare({ segmentRef, defaultEn, enSize }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]); // [{ versionTitle, text }]

  // Load the versions and their texts the first time the reader opens the panel,
  // then keep them. The data layer caches per ref, so reopening costs nothing.
  useEffect(() => {
    if (!open || status !== 'idle') return undefined;
    let live = true;
    setStatus('loading');
    setError(null);

    (async () => {
      try {
        const versions = await getTranslations(segmentRef);
        if (!live) return;
        if (!versions || versions.length === 0) {
          setRows([]);
          setStatus('done');
          return;
        }
        const texts = await Promise.all(
          versions.map(async (v) => {
            try {
              const text = await getTranslationText(segmentRef, v.versionTitle);
              return { versionTitle: v.versionTitle, text };
            } catch {
              // One version failing to load should not invent text or sink the
              // others; mark it empty and let the rest stand.
              return { versionTitle: v.versionTitle, text: '' };
            }
          })
        );
        if (!live) return;
        setRows(texts);
        setStatus('done');
      } catch (err) {
        if (!live) return;
        setError(err instanceof Error ? err.message : 'The versions did not load.');
        setStatus('error');
      }
    })();

    return () => {
      live = false;
    };
  }, [open, status, segmentRef]);

  // The versions that actually carry text for this segment. A version listed for
  // the work but empty on this segment is dropped rather than shown as a blank.
  const withText = rows.filter((r) => r.text && r.text.trim().length > 0);
  const onlyOne = status === 'done' && withText.length <= 1;

  return (
    <div style={{ marginTop: 'var(--space-sm)' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={toggleStyle}
      >
        <Languages size={16} aria-hidden="true" />
        Compare translations
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>

      {open && (
        <div style={panelStyle}>
          {status === 'loading' && (
            <p style={mutedLine}>Loading the other English versions from Sefaria. One moment.</p>
          )}

          {status === 'error' && (
            <p style={mutedLine}>
              The other versions could not be loaded from Sefaria right now, so
              there is nothing to compare. {error}
            </p>
          )}

          {onlyOne && (
            <p style={mutedLine}>
              Sefaria carries one English version for this segment. There is no
              second rendering to compare it against here.
            </p>
          )}

          {status === 'done' && withText.length > 1 && (
            <>
              <p style={introLine}>
                Each version below is one translator&rsquo;s reading of the same
                Aramaic. The page shows the first; the others read it differently.
              </p>
              {withText.map((row) => {
                const isDefault =
                  defaultEn &&
                  row.text.trim() === defaultEn.trim();
                return (
                  <div key={row.versionTitle} style={rowStyle}>
                    <div style={labelRow}>
                      <span style={versionLabel}>{row.versionTitle}</span>
                      {isDefault && <span style={defaultTag}>shown on the page</span>}
                    </div>
                    <p
                      style={{
                        fontFamily: 'var(--font-accent)',
                        fontSize: `${enSize}px`,
                        lineHeight: 1.6,
                        margin: 0,
                        color: 'var(--text)',
                      }}
                    >
                      {row.text}
                    </p>
                  </div>
                );
              })}
            </>
          )}

          <a
            href={sefariaUrl(segmentRef)}
            target="_blank"
            rel="noopener noreferrer"
            style={sefariaLink}
          >
            See this segment on Sefaria <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
      )}
    </div>
  );
}

const toggleStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.35rem',
  padding: '0.25rem 0',
  background: 'transparent',
  border: 'none',
  color: 'var(--accent)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.9rem',
  cursor: 'pointer',
};

const panelStyle = {
  marginTop: 'var(--space-sm)',
  padding: 'var(--space-md)',
  background: 'var(--bg-soft)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
};

const introLine = {
  fontSize: '0.85rem',
  color: 'var(--muted)',
  margin: '0 0 var(--space-md)',
};

const rowStyle = {
  paddingBottom: 'var(--space-md)',
  marginBottom: 'var(--space-md)',
  borderBottom: '1px solid var(--border)',
};

const labelRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-sm)',
  marginBottom: 'var(--space-xs)',
  flexWrap: 'wrap',
};

const versionLabel = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.85rem',
  fontWeight: 500,
  color: 'var(--blue-light)',
};

const defaultTag = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.72rem',
  color: '#000000',
  background: 'var(--accent-2)',
  borderRadius: 'var(--radius-pill)',
  padding: '0.05rem 0.5rem',
};

const mutedLine = {
  color: 'var(--muted)',
  margin: 0,
};

const sefariaLink = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.3rem',
  fontSize: '0.9rem',
  color: 'var(--accent)',
};
