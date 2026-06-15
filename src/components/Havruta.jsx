import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Square, Lock } from 'lucide-react';
import {
  readProviderSettings,
  buildFirstUserMessage,
} from '../lib/partner.js';
import { usePartnerConversation } from '../lib/usePartnerConversation.js';
import PartnerTurns from './PartnerTurns.jsx';

// The page-level partner panel. It is reachable only after the reader submits a
// reading of the whole page (the human-acts-first gate lives in Today.jsx, which
// renders this component only once a reading is submitted). This is the closing,
// step-back synthesis; the primary back-and-forth now happens line by line above.
// On mount it starts the first exchange with the whole daf as context.
export default function Havruta({ daf, text, reading }) {
  const { turns, streaming, partnerError, noKey, status, start, sendReply, stop } =
    usePartnerConversation();
  const [reply, setReply] = useState('');

  const dafRef = daf ? daf.ref : '';
  const dafDisplay = daf ? daf.displayEn : dafRef;

  // Start the first exchange once, when the panel mounts with a reading.
  useEffect(() => {
    start({
      dafRef,
      firstUserMessage: buildFirstUserMessage(dafRef, text, reading),
      openingReaderTurn: reading.trim(),
      sessionMeta: { dafRef, dafDisplay, reading },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSend() {
    if (sendReply(reply)) setReply('');
  }

  if (noKey) {
    const provider = readProviderSettings().provider;
    return (
      <div className="card" style={{ marginTop: 'var(--space-lg)' }}>
        <h3 style={{ marginTop: 0 }}>Your havruta</h3>
        <p style={{ margin: '0 0 var(--space-md)' }}>
          The partner runs on {provider.label} and needs your own API key for
          it. Add a key in Settings, and the partner becomes reachable. Your
          reading is saved and waiting.
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

      <PartnerTurns turns={turns} streaming={streaming} />

      {status && (
        <p
          style={{
            margin: '0 0 var(--space-md)',
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
            padding: 'var(--space-md)',
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
            The partner says nothing rather than inventing text. Fix the cause
            above and send your reply again.
          </p>
        </div>
      )}

      <div
        style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'flex-end' }}
      >
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
            onClick={onSend}
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
