import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Square, Lock, X, Download } from 'lucide-react';
import {
  readProviderSettings,
  buildSegmentFirstUserMessage,
} from '../lib/partner.js';
import { usePartnerConversation } from '../lib/usePartnerConversation.js';
import {
  turnsToMarkdown,
  downloadMarkdown,
  fileNameFor,
} from '../lib/exportMarkdown.js';
import PartnerTurns from './PartnerTurns.jsx';

// The per-line partner. It opens under one line of the daf and carries the
// human-acts-first gate inside it: the partner stays silent until the reader
// commits a one-sentence reading of this line. Then it challenges that reading
// using this line's own words. The exchange is scoped to the line and its
// neighbors, not the whole daf, so it stays on the line and stays cheap.
//
// Props:
//   daf:          { ref, displayEn } for the session record and the prompt.
//   segmentRef:   the Sefaria ref of this line, e.g. "Chullin 45a:3".
//   segmentLabel: a human label, e.g. "Amud a 3".
//   he, en:       this line's Hebrew/Aramaic and English, verbatim.
//   text:         the whole daf { a, b }, given to the partner for context.
//   onClose:      collapse this line's partner.
export default function LineHavruta({
  daf,
  text,
  segmentRef,
  segmentLabel,
  he,
  en,
  onClose,
}) {
  const { turns, streaming, partnerError, noKey, status, start, sendReply, stop } =
    usePartnerConversation();
  const [committed, setCommitted] = useState(false);
  const [reading, setReading] = useState('');
  const [reply, setReply] = useState('');

  const dafRef = daf ? daf.ref : '';
  const dafDisplay = daf ? daf.displayEn : dafRef;

  function commit() {
    const trimmed = reading.trim();
    if (trimmed.length === 0) return;
    setCommitted(true);
    start({
      dafRef,
      firstUserMessage: buildSegmentFirstUserMessage(
        dafRef,
        text,
        { label: segmentLabel, he, en },
        trimmed
      ),
      openingReaderTurn: trimmed,
      sessionMeta: {
        dafRef,
        dafDisplay,
        reading: trimmed,
        segmentRef,
        segmentLabel,
      },
    });
  }

  function onSend() {
    if (sendReply(reply)) setReply('');
  }

  return (
    <div
      style={{
        marginTop: 'var(--space-md)',
        padding: 'var(--space-md)',
        background: 'var(--bg-soft)',
        border: '1px solid var(--border)',
        borderLeft: '3px solid var(--accent)',
        borderRadius: 'var(--radius-md)',
      }}
      aria-live="polite"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-sm)',
          marginBottom: 'var(--space-sm)',
        }}
      >
        <span
          style={{
            fontSize: '0.78rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
          }}
        >
          Havruta on {segmentLabel}
        </span>
        <button
          type="button"
          className="icon-button icon-button--sm"
          onClick={onClose}
          aria-label={`Close the partner for ${segmentLabel}`}
        >
          <X size={18} />
        </button>
      </div>

      {noKey ? (
        <div>
          <p style={{ margin: '0 0 var(--space-sm)' }}>
            The partner needs your own API key. Your reading of this line is
            saved and waiting.
          </p>
          <Link to="/settings" className="pill-button">
            Open Settings
          </Link>
        </div>
      ) : !committed ? (
        <div>
          <p style={{ margin: '0 0 var(--space-sm)' }}>
            In one sentence, what is this line doing in the argument? Your
            partner stays quiet until you commit a reading of your own.
          </p>
          <label htmlFor={`commit-${segmentRef}`} className="sr-only">
            Your one-sentence reading of {segmentLabel}
          </label>
          <textarea
            id={`commit-${segmentRef}`}
            value={reading}
            onChange={(e) => setReading(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                commit();
              }
            }}
            placeholder="This line is doing..."
            rows={2}
            style={{
              width: '100%',
              padding: 'var(--space-sm)',
              fontFamily: 'var(--font-body)',
              fontSize: '1rem',
              lineHeight: 1.6,
              color: 'var(--text)',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              resize: 'vertical',
            }}
          />
          <div style={{ marginTop: 'var(--space-sm)' }}>
            <button
              type="button"
              className="pill-button pill-button--active"
              onClick={commit}
              disabled={reading.trim().length === 0}
            >
              Send to my havruta
            </button>
          </div>
        </div>
      ) : (
        <div>
          <PartnerTurns turns={turns} streaming={streaming} />

          {status && (
            <p
              style={{
                margin: '0 0 var(--space-sm)',
                color: 'var(--muted)',
                fontSize: '0.85rem',
                fontStyle: 'italic',
              }}
            >
              {status}…
            </p>
          )}

          {partnerError && (
            <div
              role="alert"
              style={{
                marginBottom: 'var(--space-md)',
                padding: 'var(--space-sm)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--accent-red)',
                color: 'var(--text)',
              }}
            >
              <p style={{ margin: 0 }}>{partnerError}</p>
              <p
                style={{
                  margin: 'var(--space-xs) 0 0',
                  color: 'var(--muted)',
                  fontSize: '0.9rem',
                }}
              >
                The partner says nothing rather than inventing text. Try again.
              </p>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              gap: 'var(--space-sm)',
              alignItems: 'flex-end',
            }}
          >
            <label htmlFor={`reply-${segmentRef}`} className="sr-only">
              Your reply to the partner on {segmentLabel}
            </label>
            <textarea
              id={`reply-${segmentRef}`}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder={
                streaming
                  ? 'The partner is answering. Wait, or stop the reply.'
                  : 'Answer the challenge, or press your own point.'
              }
              rows={2}
              disabled={streaming}
              style={{
                flex: 1,
                padding: 'var(--space-sm)',
                fontFamily: 'var(--font-body)',
                fontSize: '1rem',
                lineHeight: 1.6,
                color: 'var(--text)',
                background: 'var(--bg)',
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
                onClick={onSend}
                disabled={reply.trim().length === 0}
                aria-label="Send your reply"
              >
                <Send size={20} />
              </button>
            )}
          </div>

          {!streaming && turns.some((t) => t.role === 'partner' && t.text) && (
            <button
              type="button"
              className="pill-button"
              style={{ marginTop: 'var(--space-sm)' }}
              onClick={() =>
                downloadMarkdown(
                  fileNameFor(`${dafDisplay} ${segmentLabel}`),
                  turnsToMarkdown({ dafDisplay, segmentLabel, turns })
                )
              }
            >
              <Download size={16} /> Download this chat
            </button>
          )}

          <p
            style={{
              margin: 'var(--space-sm) 0 0',
              color: 'var(--muted)',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Lock size={13} aria-hidden="true" />
            Saved to your device only, in your Archive.
          </p>
        </div>
      )}
    </div>
  );
}
