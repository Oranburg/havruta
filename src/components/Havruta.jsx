import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Square, Lock } from 'lucide-react';
import { streamHavruta } from '../lib/anthropic.js';
import {
  KEY_STORAGE,
  MODEL_STORAGE,
  LEVEL_STORAGE,
  DEFAULT_MODEL,
  DEFAULT_LEVEL,
  buildSystemPrompt,
  buildFirstUserMessage,
} from '../lib/partner.js';
import { createSession, updateSession } from '../lib/sessions.js';

// Render a partner turn. Hebrew runs in Hebrew characters can be wrapped in
// Hebrew brackets; the partner is told to quote Hebrew in Hebrew characters,
// so we detect Hebrew characters and tag those spans with the .hebrew helper
// (font-hebrew, right to left) so they read correctly.
const HEBREW_RANGE = /[֐-׿יִ-ﭏ]/;

function renderPartnerText(text) {
  // Split into runs of Hebrew-bearing text and plain text so a quoted Hebrew
  // phrase gets the Hebrew font and right-to-left direction.
  const parts = text.split(/(\s*[֐-׿יִ-ﭏ][֐-׿יִ-ﭏ\s֑-ׇ"'.,:;()־-]*)/g);
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

// Read the saved key, model, and level from localStorage at call time.
function readSettings() {
  let apiKey = '';
  let model = DEFAULT_MODEL;
  let level = DEFAULT_LEVEL;
  try {
    apiKey = localStorage.getItem(KEY_STORAGE) || '';
    model = localStorage.getItem(MODEL_STORAGE) || DEFAULT_MODEL;
    level = localStorage.getItem(LEVEL_STORAGE) || DEFAULT_LEVEL;
  } catch {
    // localStorage unavailable; fall back to defaults.
  }
  return { apiKey, model, level };
}

// The partner panel. It is reachable only after the reader submits a reading
// (the human-acts-first gate lives in Today.jsx, which renders this component
// only once a reading is submitted). On mount it starts the first exchange.
export default function Havruta({ daf, text, reading }) {
  // turns holds the visible conversation: { role: 'partner' | 'reader', text }.
  const [turns, setTurns] = useState([]);
  const [reply, setReply] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [partnerError, setPartnerError] = useState(null);
  const [noKey, setNoKey] = useState(false);

  // The API message history sent on each call, kept separate from the visible
  // turns so the saved record and the next call always carry the full exchange.
  const messagesRef = useRef([]);
  const sessionIdRef = useRef(null);
  const abortRef = useRef(null);
  const startedRef = useRef(false);
  const streamingTextRef = useRef('');

  const settings = readSettings();
  const dafRef = daf ? daf.ref : '';
  const dafDisplay = daf ? daf.displayEn : dafRef;

  // Start the first exchange once, when the panel mounts with a reading.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const { apiKey, model, level } = readSettings();
    if (!apiKey) {
      setNoKey(true);
      return;
    }

    const system = buildSystemPrompt(dafRef, level);
    const firstUser = buildFirstUserMessage(dafRef, text, reading);
    messagesRef.current = [{ role: 'user', content: firstUser }];

    // Save the session now so the reading and the opening exchange are recorded
    // even if the reader closes the page mid-stream.
    const record = createSession({
      dafRef,
      dafDisplay,
      reading,
      messages: messagesRef.current,
    });
    sessionIdRef.current = record.id;

    // Show the reader's reading as the opening turn, then stream the challenge.
    setTurns([{ role: 'reader', text: reading.trim() }]);
    runExchange(system, model, apiKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Run one streamed exchange: append an empty partner turn, then fill it as
  // text arrives. On completion, commit the partner turn to the message history
  // and the saved record.
  function runExchange(system, model, apiKey) {
    setStreaming(true);
    setPartnerError(null);
    streamingTextRef.current = '';

    // Add a placeholder partner turn that the stream fills.
    setTurns((prev) => [...prev, { role: 'partner', text: '', pending: true }]);

    const controller = new AbortController();
    abortRef.current = controller;

    streamHavruta({
      apiKey,
      model,
      system,
      messages: messagesRef.current,
      signal: controller.signal,
      onText: (chunk) => {
        streamingTextRef.current += chunk;
        setTurns((prev) => {
          const next = prev.slice();
          const last = next[next.length - 1];
          if (last && last.role === 'partner') {
            next[next.length - 1] = {
              role: 'partner',
              text: streamingTextRef.current,
              pending: true,
            };
          }
          return next;
        });
      },
      onDone: () => {
        const finalText = streamingTextRef.current;
        abortRef.current = null;
        setStreaming(false);

        // Mark the partner turn done in the visible conversation.
        setTurns((prev) => {
          const next = prev.slice();
          const last = next[next.length - 1];
          if (last && last.role === 'partner') {
            next[next.length - 1] = { role: 'partner', text: finalText };
          }
          return next;
        });

        // An empty completion (for example an immediate abort) leaves nothing to
        // record. Otherwise commit the partner turn to history and the record.
        if (finalText.trim().length > 0) {
          messagesRef.current = [
            ...messagesRef.current,
            { role: 'assistant', content: finalText },
          ];
          if (sessionIdRef.current) {
            updateSession(sessionIdRef.current, {
              messages: messagesRef.current,
            });
          }
        } else {
          // Remove the empty partner placeholder so the panel does not show a
          // blank bubble.
          setTurns((prev) => prev.filter((t) => !(t.role === 'partner' && !t.text)));
        }
      },
      onError: (err) => {
        abortRef.current = null;
        setStreaming(false);
        setPartnerError(err.message);
        // Drop the empty partner placeholder; never leave invented or partial
        // text standing in its place.
        setTurns((prev) => prev.filter((t) => !(t.role === 'partner' && !t.text)));
      },
    });
  }

  function sendReply() {
    const trimmed = reply.trim();
    if (trimmed.length === 0 || streaming) return;

    const { apiKey, model, level } = readSettings();
    if (!apiKey) {
      setNoKey(true);
      return;
    }

    // Append the reader's reply to the visible conversation and the history.
    setTurns((prev) => [...prev, { role: 'reader', text: trimmed }]);
    messagesRef.current = [
      ...messagesRef.current,
      { role: 'user', content: trimmed },
    ];
    if (sessionIdRef.current) {
      // Record the reader's reply (and a second-or-later reading) immediately.
      updateSession(sessionIdRef.current, {
        messages: messagesRef.current,
      });
    }
    setReply('');

    const system = buildSystemPrompt(dafRef, level);
    runExchange(system, model, apiKey);
  }

  function stop() {
    if (abortRef.current) {
      abortRef.current.abort();
    }
  }

  // No key saved: a calm message with a link to Settings.
  if (noKey) {
    return (
      <div className="card" style={{ marginTop: 'var(--space-lg)' }}>
        <h3 style={{ marginTop: 0 }}>Your havruta</h3>
        <p style={{ margin: '0 0 var(--space-md)' }}>
          The partner runs on Claude and needs your own Anthropic API key. Add a
          key in Settings, and the partner becomes reachable. Your reading is
          saved and waiting.
        </p>
        <Link to="/settings" className="pill-button">
          Open Settings
        </Link>
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{ marginTop: 'var(--space-lg)' }}
      aria-live="polite"
    >
      <h3 style={{ marginTop: 0 }}>Your havruta</h3>

      <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {turns.map((turn, i) => (
          <li
            key={i}
            style={{
              marginBottom: 'var(--space-md)',
              padding: 'var(--space-md)',
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
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
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

      {partnerError && (
        <div
          role="alert"
          style={{
            marginBottom: 'var(--space-md)',
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--accent-red)',
            color: 'var(--text)',
          }}
        >
          <p style={{ margin: 0 }}>{partnerError}</p>
          <p style={{ margin: 'var(--space-xs) 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
            The partner says nothing rather than inventing text. Fix the cause
            above and send your reply again.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'flex-end' }}>
        <label htmlFor="havruta-reply" className="sr-only">
          Your reply to the partner
        </label>
        <textarea
          id="havruta-reply"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder={
            streaming
              ? 'The partner is answering. Wait, or stop the reply.'
              : 'Answer the challenge, or press your own point.'
          }
          rows={3}
          disabled={streaming}
          style={{
            flex: 1,
            padding: 'var(--space-md)',
            fontFamily: 'var(--font-body)',
            fontSize: '1rem',
            lineHeight: 1.6,
            color: 'var(--text)',
            background: 'var(--bg-soft)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            resize: 'vertical',
          }}
        />
        {streaming ? (
          <button
            type="button"
            className="icon-button"
            onClick={stop}
            aria-label="Stop the partner's reply"
          >
            <Square size={20} />
          </button>
        ) : (
          <button
            type="button"
            className="icon-button"
            onClick={sendReply}
            disabled={reply.trim().length === 0}
            aria-label="Send your reply"
          >
            <Send size={20} />
          </button>
        )}
      </div>

      <p
        style={{
          margin: 'var(--space-md) 0 0',
          color: 'var(--muted)',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
        }}
      >
        <Lock size={14} aria-hidden="true" />
        This exchange is saved to your device only. It is in your Archive, kept
        whole, challenges and all.
      </p>
    </div>
  );
}
