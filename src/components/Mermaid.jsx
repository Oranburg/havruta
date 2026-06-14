import { useEffect, useId, useState } from 'react';

// Read the current theme so the diagram is drawn with colors that read in both
// dark and light mode.
function readTheme() {
  if (typeof document !== 'undefined') {
    const current = document.documentElement.getAttribute('data-theme');
    if (current === 'dark' || current === 'light') return current;
  }
  return 'dark';
}

// Map the app's palette onto Mermaid's themeVariables for a given mode. The base
// theme is the most overridable, so we start there and set the colors by hand
// from the app's tokens (navy fills, light-blue lines, the app serif).
function themeVarsFor(mode) {
  const serif = "'Crimson Text', Georgia, serif";
  if (mode === 'light') {
    return {
      fontFamily: serif,
      fontSize: '16px',
      background: '#FFFFFF',
      primaryColor: '#E9ECEF',
      primaryBorderColor: '#2459A9',
      primaryTextColor: '#0A3255',
      lineColor: '#2459A9',
      secondaryColor: '#F8F9FA',
      tertiaryColor: '#F8F9FA',
      textColor: '#0A3255',
      // Sequence-diagram specifics.
      actorBkg: '#E9ECEF',
      actorBorder: '#2459A9',
      actorTextColor: '#0A3255',
      signalColor: '#0A3255',
      signalTextColor: '#0A3255',
      labelBoxBkgColor: '#E9ECEF',
      labelBoxBorderColor: '#2459A9',
      labelTextColor: '#0A3255',
      noteBkgColor: '#FFD65C',
      noteTextColor: '#0A3255',
      noteBorderColor: '#B21F2C',
    };
  }
  return {
    fontFamily: serif,
    fontSize: '16px',
    background: '#0A3255',
    primaryColor: '#0D3D68',
    primaryBorderColor: '#6DACDE',
    primaryTextColor: '#FFFFFF',
    lineColor: '#6DACDE',
    secondaryColor: '#0A3255',
    tertiaryColor: '#0A3255',
    textColor: '#FFFFFF',
    actorBkg: '#0D3D68',
    actorBorder: '#6DACDE',
    actorTextColor: '#FFFFFF',
    signalColor: '#B5E1E1',
    signalTextColor: '#FFFFFF',
    labelBoxBkgColor: '#0D3D68',
    labelBoxBorderColor: '#6DACDE',
    labelTextColor: '#FFFFFF',
    noteBkgColor: '#FFD65C',
    noteTextColor: '#0A3255',
    noteBorderColor: '#B21F2C',
  };
}

// A reusable Mermaid diagram. It renders the chart string to inline SVG on mount
// and again when the app's theme changes, so a diagram drawn in dark mode is
// redrawn in light mode rather than left with the wrong colors. The mermaid
// library loads with a dynamic import so it stays out of the initial bundle and
// renders only on the pages that use it.
export default function Mermaid({ chart, caption }) {
  const [svg, setSvg] = useState('');
  const [failed, setFailed] = useState(false);
  const reactId = useId();
  // Mermaid needs a DOM-id-safe string for its render target.
  const renderId = `mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [mode, setMode] = useState(readTheme);

  // Watch the data-theme attribute on <html> so the diagram re-renders when the
  // reader flips dark and light mode.
  useEffect(() => {
    const target = document.documentElement;
    const observer = new MutationObserver(() => setMode(readTheme()));
    observer.observe(target, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'base',
          themeVariables: themeVarsFor(mode),
          flowchart: { curve: 'basis', htmlLabels: true, useMaxWidth: true },
          sequence: { useMaxWidth: true, mirrorActors: false },
        });
        const { svg: out } = await mermaid.render(renderId, chart);
        if (!cancelled) {
          setSvg(out);
          setFailed(false);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [chart, mode, renderId]);

  if (failed) {
    return (
      <p className="card" style={{ color: 'var(--muted)' }}>
        This diagram could not be drawn here. The text around it carries the same
        idea.
      </p>
    );
  }

  return (
    <figure className="mermaid-figure">
      <div
        className="mermaid-figure__diagram"
        // The SVG comes from mermaid's own renderer, not from reader input.
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {caption && (
        <figcaption className="mermaid-figure__caption">{caption}</figcaption>
      )}
    </figure>
  );
}
