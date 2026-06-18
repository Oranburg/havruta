// speech.js: a thin wrapper over the browser's built-in speech synthesis, used
// for the "read aloud" control on the daf. This is a plain reading aid that uses
// whatever Hebrew voice the browser exposes. It is not cantillation and not a
// recording; the Talmud has no leyning tradition to play, so the honest feature
// here is the browser reading the on-screen Hebrew and Aramaic.
//
// The Web Speech API ships in the browser, so there is no dependency to add.
// Voice availability varies by platform: many desktop browsers and iOS expose a
// Hebrew voice (lang he-IL), while some Android and Linux builds do not. We never
// read Hebrew with an English voice, because that mangles it; when no Hebrew
// voice is present the control says so and does not speak.

// Whether the browser exposes speech synthesis at all.
export function speechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// Strip any HTML tags and decode the handful of entities Sefaria uses, so the
// synthesizer reads the words rather than the markup. The daf segments can carry
// inline <b>, <i>, and <span> from Sefaria.
export function plainTextFromHtml(value) {
  if (typeof value !== 'string' || value.length === 0) return '';
  if (typeof document !== 'undefined') {
    const tmpl = document.createElement('template');
    tmpl.innerHTML = value;
    return (tmpl.content.textContent || '').replace(/\s+/g, ' ').trim();
  }
  // No DOM (the smoke test runs in Node): a conservative tag strip.
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// The Hebrew voices the browser exposes, if any. Returns an array (possibly
// empty). The voice list can populate asynchronously, so callers should also
// listen for the voiceschanged event and re-query.
export function hebrewVoices() {
  if (!speechSupported()) return [];
  const voices = window.speechSynthesis.getVoices() || [];
  return voices.filter((v) => /^he\b|^iw\b|-IL\b/i.test(v.lang || ''));
}

// Pick the best Hebrew voice: a local one first (it speaks without a network),
// then any Hebrew voice. Returns null when the browser has none.
export function bestHebrewVoice() {
  const hebrew = hebrewVoices();
  if (hebrew.length === 0) return null;
  const local = hebrew.find((v) => v.localService);
  return local || hebrew[0];
}

// Build an utterance for a piece of Hebrew text on a Hebrew voice. Returns null
// when there is nothing to say or no Hebrew voice is available, so the caller
// degrades rather than speaking Hebrew with an English voice.
export function buildHebrewUtterance(text, voice) {
  if (!speechSupported()) return null;
  const clean = plainTextFromHtml(text);
  if (!clean) return null;
  const useVoice = voice || bestHebrewVoice();
  if (!useVoice) return null;
  const u = new window.SpeechSynthesisUtterance(clean);
  u.voice = useVoice;
  u.lang = useVoice.lang || 'he-IL';
  // A little slower than default helps an unpointed Hebrew string read clearly.
  u.rate = 0.9;
  return u;
}

// Stop any current speech. Safe to call when nothing is speaking and when the
// API is absent, so it doubles as the unmount cleanup.
export function cancelSpeech() {
  if (speechSupported()) {
    try { window.speechSynthesis.cancel(); } catch { /* nothing to cancel */ }
  }
}
