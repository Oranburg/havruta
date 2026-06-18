import { useEffect, useRef, useState } from 'react';
import { Volume2, Pause, Play, Square } from 'lucide-react';
import {
  speechSupported,
  hebrewVoices,
  bestHebrewVoice,
  buildHebrewUtterance,
  cancelSpeech,
} from '../lib/speech.js';

// A "read aloud" control for the daf. It reads the on-screen Hebrew and Aramaic
// using the browser's built-in speech synthesis, on a Hebrew voice when the
// browser exposes one. This is a plain reading aid, not cantillation: the Talmud
// has no leyning tradition to play, so the honest feature is the browser sounding
// out the text.
//
// It never starts on its own; speech begins only when the reader presses play.
// When no Hebrew voice is available it says so and does not speak, because an
// English voice mangles Hebrew. On unmount it cancels speech, so leaving the page
// does not leave a voice running.
//
// Props:
//   segments: an array of Hebrew/Aramaic strings (the daf lines), possibly with
//             inline HTML from Sefaria, which the speech layer strips.
//   label:    what is being read, for the control's heading.
export default function ReadAloud({ segments, label = 'this daf' }) {
  const supported = speechSupported();

  // The voice list can arrive after first paint, so track whether a Hebrew voice
  // exists and refresh it on the voiceschanged event. Keyed on nothing the effect
  // sets, so it is safe under React 18 StrictMode's double-invoke.
  const [hasHebrewVoice, setHasHebrewVoice] = useState(
    () => supported && hebrewVoices().length > 0
  );
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);

  // Hold the queued utterances so a pause/resume and an unmount can act on them.
  const utterancesRef = useRef([]);

  useEffect(() => {
    if (!supported) return undefined;
    const refresh = () => setHasHebrewVoice(hebrewVoices().length > 0);
    refresh();
    window.speechSynthesis.addEventListener('voiceschanged', refresh);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', refresh);
    };
  }, [supported]);

  // Cancel any speech on unmount so a navigation away does not keep talking.
  useEffect(() => {
    return () => {
      cancelSpeech();
    };
  }, []);

  // If the daf changes underneath the control, stop whatever is being read.
  // Keyed on the joined text, a stable input, not on the speaking flag it clears.
  const joined = Array.isArray(segments) ? segments.join(' ') : '';
  useEffect(() => {
    cancelSpeech();
    setSpeaking(false);
    setPaused(false);
  }, [joined]);

  function start() {
    if (!supported || !hasHebrewVoice) return;
    cancelSpeech();
    const voice = bestHebrewVoice();
    const list = (Array.isArray(segments) ? segments : [])
      .map((seg) => buildHebrewUtterance(seg, voice))
      .filter(Boolean);
    if (list.length === 0) return;
    // The last utterance clears the speaking state when the reading finishes.
    list[list.length - 1].addEventListener('end', () => {
      setSpeaking(false);
      setPaused(false);
    });
    utterancesRef.current = list;
    list.forEach((u) => window.speechSynthesis.speak(u));
    setSpeaking(true);
    setPaused(false);
  }

  function pauseOrResume() {
    if (!supported) return;
    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    } else {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  }

  function stop() {
    cancelSpeech();
    setSpeaking(false);
    setPaused(false);
  }

  if (!supported) {
    return (
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>
          This browser does not offer speech, so there is no read-aloud here.
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
        <Volume2 size={18} aria-hidden="true" style={{ color: 'var(--accent-2)' }} />
        <span style={{ fontFamily: 'var(--font-headline)', letterSpacing: '0.03em' }}>
          Read {label} aloud
        </span>
      </div>

      {hasHebrewVoice ? (
        <>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)', flexWrap: 'wrap' }}>
            {!speaking ? (
              <button
                type="button"
                className="pill-button pill-button--active"
                onClick={start}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Play size={16} aria-hidden="true" /> Play
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="pill-button"
                  onClick={pauseOrResume}
                  aria-pressed={paused}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
                  {paused ? 'Resume' : 'Pause'}
                </button>
                <button
                  type="button"
                  className="pill-button"
                  onClick={stop}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Square size={16} aria-hidden="true" /> Stop
                </button>
              </>
            )}
          </div>
          <p style={{ margin: 'var(--space-sm) 0 0', color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
            This is a plain reading by the browser, not the chant. It uses a Hebrew
            voice your device provides, so the pronunciation is approximate,
            especially on the Aramaic.
          </p>
        </>
      ) : (
        <p style={{ margin: 'var(--space-sm) 0 0', color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
          Your browser does not offer a Hebrew voice, so there is nothing to play.
          Reading the Hebrew with an English voice would mangle it, so the control
          stays quiet here. A device with a Hebrew voice installed (many phones and
          desktops have one) will read the daf aloud.
        </p>
      )}
    </div>
  );
}
