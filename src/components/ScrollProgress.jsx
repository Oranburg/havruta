import { useEffect, useState } from 'react';

// A thin bar fixed at the very top of the viewport that fills as the reader
// scrolls down the page. The fill is a gradient from Seth's palette, deep blue
// through light blue to yellow, so the reader sees how far into the daf they
// have read. The bar sits above the sticky header on its own layer and never
// blocks a tap, so it does not collide with the header controls.
//
// It reads scroll position from the document, which works for a normally
// scrolling page in a browser and inside a Capacitor web wrap. The listener is
// passive and throttled to one update per animation frame, so scrolling stays
// smooth on a phone. A reader who has set prefers-reduced-motion still gets the
// bar; the fill width changes without an added transition.
export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop || 0;
      // The full scrollable distance is the document height minus one viewport.
      const scrollable = doc.scrollHeight - window.innerHeight;
      const ratio = scrollable > 0 ? scrollTop / scrollable : 0;
      setProgress(Math.max(0, Math.min(1, ratio)));
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };

    // Measure once on mount so a reload partway down the page shows correctly,
    // and remeasure on resize because the scrollable distance changes with it.
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        // Above the sticky header (z-index 20) so the fill is always visible.
        zIndex: 40,
        // A faint track so the unfilled part reads in both dark and light mode.
        background: 'rgba(127,127,127,0.18)',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress * 100}%`,
          background:
            'linear-gradient(90deg, var(--blue-deep), var(--blue-light), var(--yellow))',
          // A subtle ease so the fill keeps up without lagging the scroll.
          // Omitted when the user prefers reduced motion.
          transition: prefersReducedMotion ? 'none' : 'width 0.08s linear',
        }}
      />
    </div>
  );
}
