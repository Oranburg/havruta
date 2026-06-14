import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import {
  KEY_STORAGE,
  MODEL_STORAGE,
  LEVEL_STORAGE,
  DEFAULT_MODEL,
  DEFAULT_LEVEL,
} from '../lib/partner.js';

const inputStyle = {
  width: '100%',
  padding: 'var(--space-md)',
  fontFamily: 'var(--font-body)',
  fontSize: '1rem',
  color: 'var(--text)',
  background: 'var(--bg-soft)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
};

const labelStyle = {
  display: 'block',
  marginBottom: 'var(--space-xs)',
  fontFamily: 'var(--font-headline)',
  fontWeight: 700,
  color: 'var(--blue-light)',
};

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [savedFlash, setSavedFlash] = useState('');

  // Load current values from localStorage on mount.
  useEffect(() => {
    try {
      setApiKey(localStorage.getItem(KEY_STORAGE) || '');
      setModel(localStorage.getItem(MODEL_STORAGE) || DEFAULT_MODEL);
    } catch {
      // localStorage unavailable; keep defaults.
    }
  }, []);

  function flash(message) {
    setSavedFlash(message);
    window.setTimeout(() => setSavedFlash(''), 2500);
  }

  function saveKey() {
    try {
      const trimmed = apiKey.trim();
      if (trimmed) {
        localStorage.setItem(KEY_STORAGE, trimmed);
        setApiKey(trimmed);
        flash('Key saved in this browser.');
      }
    } catch {
      flash('This browser would not let the app save the key.');
    }
  }

  function clearKey() {
    try {
      localStorage.removeItem(KEY_STORAGE);
    } catch {
      // Nothing to do.
    }
    setApiKey('');
    flash('Key cleared from this browser.');
  }

  function saveModel() {
    try {
      const trimmed = model.trim() || DEFAULT_MODEL;
      localStorage.setItem(MODEL_STORAGE, trimmed);
      setModel(trimmed);
      flash('Model saved.');
    } catch {
      flash('This browser would not let the app save the model.');
    }
  }

  return (
    <section>
      <h1>Settings</h1>

      <h2>Your Anthropic API key</h2>
      <div className="card">
        <label htmlFor="api-key" style={labelStyle}>
          API key
        </label>
        <input
          id="api-key"
          type="password"
          autoComplete="off"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-ant-..."
          style={inputStyle}
        />
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-sm)',
            marginTop: 'var(--space-md)',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            className="pill-button pill-button--active"
            onClick={saveKey}
            disabled={apiKey.trim().length === 0}
          >
            Save key
          </button>
          <button type="button" className="pill-button" onClick={clearKey}>
            Clear key
          </button>
        </div>
        <p style={{ margin: 'var(--space-md) 0 0', color: 'var(--muted)' }}>
          The key is stored only in this browser. The app uses it to call Claude
          directly, and sends it nowhere else. There is no server in between.
          You get a key from the Anthropic Console, and your account pays for the
          calls.
        </p>
      </div>

      <h2>Claude model</h2>
      <div className="card">
        <label htmlFor="model" style={labelStyle}>
          Model
        </label>
        <input
          id="model"
          type="text"
          autoComplete="off"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder={DEFAULT_MODEL}
          style={inputStyle}
        />
        <div style={{ marginTop: 'var(--space-md)' }}>
          <button
            type="button"
            className="pill-button pill-button--active"
            onClick={saveModel}
          >
            Save model
          </button>
        </div>
        <p style={{ margin: 'var(--space-md) 0 0', color: 'var(--muted)' }}>
          This is the Claude model the partner uses. The default is{' '}
          <code style={{ fontFamily: 'var(--font-mono)' }}>{DEFAULT_MODEL}</code>
          . You can change it to another Claude model your key can reach.
        </p>
      </div>

      {savedFlash && (
        <p
          role="status"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginTop: 'var(--space-md)',
            color: 'var(--accent-2)',
          }}
        >
          <Check size={16} aria-hidden="true" />
          {savedFlash}
        </p>
      )}

      <h2>About and credits</h2>
      <div className="card">
        <p style={{ marginTop: 0 }}>
          Havruta is a daf yomi study partner that challenges your reading
          instead of handing you the answer. You read the page and write your own
          reading first; the partner presses on it.
        </p>
        <p>
          Created by Seth C. Oranburg.{' '}
          <a href="https://oranburg.law" target="_blank" rel="noreferrer">
            oranburg.law
          </a>
        </p>
        <p>
          The partner is built on the Silicon Havruta from{' '}
          <em>Judgment Proof</em>, Chapter 13.
        </p>
        <p>
          Every text and image comes from{' '}
          <a href="https://www.sefaria.org" target="_blank" rel="noreferrer">
            Sefaria
          </a>
          . The English translation is the William Davidson Talmud, from Koren
          Publishers. The Hebrew and Aramaic is the William Davidson vocalized
          edition, also from Koren. The page images come from Sefaria and the
          National Library of Israel.
        </p>
        <p style={{ marginBottom: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>
          The app is free and non-commercial. Keeping these credits visible is
          both the license requirement and the right thing.
        </p>
      </div>
    </section>
  );
}
