import { useEffect, useState } from 'react';
import { getSefariaText } from '../lib/sefaria.js';

// Sanitize an HTML string from Sefaria before injecting it into the DOM.
// Creates a detached template element, strips dangerous tags and event-handler
// attributes, and returns the safe innerHTML. Normal inline formatting
// (em, strong, span, b, i, small) survives; script, style, iframe, object,
// embed, and any on* attribute do not.
function sanitizeSefariaHtml(html) {
  if (typeof html !== 'string') return '';
  const tmpl = document.createElement('template');
  tmpl.innerHTML = html;
  const root = tmpl.content;

  // Walk every element in the fragment.
  root.querySelectorAll('*').forEach((el) => {
    const tag = el.tagName.toLowerCase();
    if (['script', 'style', 'iframe', 'object', 'embed'].includes(tag)) {
      el.remove();
      return;
    }
    // Remove event-handler attributes (on*) and javascript: hrefs/srcs.
    [...el.attributes].forEach((attr) => {
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name);
        return;
      }
      if (
        (attr.name === 'href' || attr.name === 'src') &&
        /^\s*javascript:/i.test(attr.value)
      ) {
        el.removeAttribute(attr.name);
      }
    });
  });

  // Serialize back to a string.
  const div = document.createElement('div');
  div.appendChild(root.cloneNode(true));
  return div.innerHTML;
}

// Render the verbatim text of one Sefaria ref: Hebrew or Aramaic in Hebrew
// characters right to left, English alongside when Sefaria carries it, with the
// work name and the Sefaria credit. The text is fetched here and never
// generated; when it does not load, the panel says so and shows nothing else.
//
// Fetched text is cached in a module-level map so reopening a commentator or a
// connection is instant. The service worker already caches the Sefaria GETs;
// this cache spares even the network round trip within a session.
const cache = new Map();

export default function SefariaText({ refToLoad, heSize = 24, enSize = 18 }) {
  const [data, setData] = useState(() => cache.get(refToLoad) || null);
  const [loading, setLoading] = useState(() => !cache.has(refToLoad));
  const [error, setError] = useState(null);

  useEffect(() => {
    let live = true;

    if (cache.has(refToLoad)) {
      setData(cache.get(refToLoad));
      setLoading(false);
      setError(null);
      return undefined;
    }

    setLoading(true);
    setError(null);
    getSefariaText(refToLoad)
      .then((result) => {
        if (!live) return;
        cache.set(refToLoad, result);
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        if (!live) return;
        setError(err instanceof Error ? err.message : 'Something went wrong.');
        setData(null);
        setLoading(false);
      });

    return () => {
      live = false;
    };
  }, [refToLoad]);

  if (loading) {
    return (
      <p style={{ color: 'var(--muted)', margin: 'var(--space-sm) 0 0' }}>
        Loading this text from Sefaria. One moment.
      </p>
    );
  }

  if (error) {
    return (
      <p style={{ color: 'var(--muted)', margin: 'var(--space-sm) 0 0' }}>
        This text could not be loaded from Sefaria right now, so there is nothing
        to show. {error}
      </p>
    );
  }

  if (!data || (data.he.length === 0 && data.en.length === 0)) {
    return (
      <p style={{ color: 'var(--muted)', margin: 'var(--space-sm) 0 0' }}>
        Sefaria returned no text for this reference.
      </p>
    );
  }

  const count = Math.max(data.he.length, data.en.length);
  const segments = Array.from({ length: count }, (_, i) => i);

  return (
    <div>
      <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {segments.map((i) => {
          const he = data.he[i] || '';
          const en = data.en[i] || '';
          return (
            <li
              key={i}
              style={{
                padding: 'var(--space-sm) 0',
                borderBottom:
                  i < count - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              {he && (
                <p
                  className="hebrew"
                  style={{
                    fontSize: `${heSize}px`,
                    lineHeight: 1.9,
                    margin: 0,
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitizeSefariaHtml(he) }}
                />
              )}
              {en && (
                <p
                  style={{
                    fontFamily: 'var(--font-accent)',
                    fontSize: `${enSize}px`,
                    lineHeight: 1.7,
                    margin: he ? 'var(--space-sm) 0 0' : 0,
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

      <p
        style={{
          margin: 'var(--space-sm) 0 0',
          color: 'var(--muted)',
          fontSize: '0.8rem',
        }}
      >
        {data.ref} (text from Sefaria)
      </p>
    </div>
  );
}
