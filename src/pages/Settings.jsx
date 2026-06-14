import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import {
  KEY_STORAGE,
  MODEL_STORAGE,
  LEVEL_STORAGE,
  DEFAULT_MODEL,
  DEFAULT_LEVEL,
} from '../lib/partner.js';

// The calibration dial. Friction is matched to capacity (docs/CONSTITUTION.md
// requirement 4). Each step stores a descriptive level string that reads well
// where the partner prompt drops it into "The owner has set the challenge level
// to: {{LEVEL}}." The prompt already tells the partner to slow down and add a
// foothold at a lower level and to withhold scaffolding and press harder at a
// higher one, so each string describes the reader and the push, and at every
// step the reader stays the one who decides what the page means. The middle step
// is the default, the curious amateur. Ordered gentler to harder.
const LEVELS = [
  {
    name: 'Gentle',
    blurb: 'One more foothold, a slower pace. Good for a hard daf.',
    value:
      'an interested amateur who is new to the page and wants to be met gently. Give one more foothold than usual, slow down, and take one step at a time. Keep the reader the one who decides what the page means.',
  },
  {
    name: 'Easing in',
    blurb: 'A little more help than the middle setting.',
    value:
      'an interested amateur who knows the alphabet and looks things up, and who wants a bit more help. Offer a small foothold before you press, and keep the challenge to one point at a time.',
  },
  {
    name: 'Curious amateur',
    blurb: 'The default. Reads parsha, knows the alphabet, looks things up.',
    value: DEFAULT_LEVEL,
  },
  {
    name: 'Pushing',
    blurb: 'Less scaffolding, sharper challenges.',
    value:
      'a capable reader who wants to be pushed. Withhold the easy foothold, press on the weakest step in the reading, and raise the next layer rather than settling the point.',
  },
  {
    name: 'Hard',
    blurb: 'Minimal scaffolding, the hardest press.',
    value:
      'a strong reader who wants the hardest study. Withhold scaffolding, press hard on the line that was passed over and the step that was assumed, and keep raising the counter-text until the reading has to answer for all of it. The reader still decides what the page means.',
  },
];

// Match a stored level string back to a dial step. An unrecognized value (an
// older or hand-set string) lands on the default step without losing the value.
function indexForLevel(value) {
  const found = LEVELS.findIndex((l) => l.value === value);
  return found === -1 ? 2 : found;
}

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
  const [levelIndex, setLevelIndex] = useState(2);
  const [savedFlash, setSavedFlash] = useState('');

  // Load current values from localStorage on mount.
  useEffect(() => {
    try {
      setApiKey(localStorage.getItem(KEY_STORAGE) || '');
      setModel(localStorage.getItem(MODEL_STORAGE) || DEFAULT_MODEL);
      const savedLevel = localStorage.getItem(LEVEL_STORAGE);
      setLevelIndex(savedLevel ? indexForLevel(savedLevel) : 2);
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

  // The dial saves the moment the reader picks a step, so it can be changed any
  // time and the partner reads the new level on its next exchange.
  function pickLevel(index) {
    setLevelIndex(index);
    try {
      localStorage.setItem(LEVEL_STORAGE, LEVELS[index].value);
      flash(`Challenge set to ${LEVELS[index].name.toLowerCase()}.`);
    } catch {
      flash('This browser would not let the app save the setting.');
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
          directly and sends it nowhere else. There is no server in between, and
          your own account pays for the calls.
        </p>

        <details style={{ marginTop: 'var(--space-md)' }}>
          <summary
            style={{
              cursor: 'pointer',
              fontFamily: 'var(--font-headline)',
              fontWeight: 700,
              color: 'var(--blue-light)',
            }}
          >
            How to get a key
          </summary>
          <ol style={{ margin: 'var(--space-sm) 0 0', paddingLeft: '1.2rem', lineHeight: 1.7 }}>
            <li>
              Open the Anthropic Console at{' '}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noreferrer"
              >
                console.anthropic.com
              </a>
              . This is the developer console, separate from the Claude app, so
              sign in or create an account.
            </li>
            <li>
              Add a little credit first, or the key will not work. Under Plans and
              Billing, put a small pay-as-you-go amount on the account. Study runs
              on a few dollars, and this is separate from any Claude subscription
              you already pay for.
            </li>
            <li>
              Go to Settings, then API Keys, and choose Create Key. Name it
              something like Havruta.
            </li>
            <li>
              Copy the key. It starts with{' '}
              <code style={{ fontFamily: 'var(--font-mono)' }}>sk-ant-</code>, and
              you see it only once.
            </li>
            <li>Paste it in the field above and Save.</li>
          </ol>
        </details>
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

      <h2>How hard the partner pushes</h2>
      <div className="card">
        <p style={{ marginTop: 0 }}>
          The partner matches its challenge to you. Set how much it leans on you
          and how much it helps. A gentler setting adds a foothold and slows
          down; a harder setting pulls the scaffolding away and presses on the
          weak step. You decide what the page means at every setting.
        </p>
        <div
          role="group"
          aria-label="Challenge level"
          style={{
            display: 'flex',
            gap: 'var(--space-xs)',
            flexWrap: 'wrap',
            marginTop: 'var(--space-md)',
          }}
        >
          {LEVELS.map((level, i) => (
            <button
              key={level.name}
              type="button"
              className={
                i === levelIndex
                  ? 'pill-button pill-button--active'
                  : 'pill-button'
              }
              aria-pressed={i === levelIndex}
              onClick={() => pickLevel(i)}
            >
              {level.name}
            </button>
          ))}
        </div>
        <p
          style={{
            margin: 'var(--space-md) 0 0',
            color: 'var(--muted)',
          }}
        >
          {LEVELS[levelIndex].blurb}
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
