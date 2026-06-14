import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import {
  LEVEL_STORAGE,
  PROVIDER_STORAGE,
  DEFAULT_LEVEL,
  DEFAULT_PROVIDER_ID,
  PROVIDERS,
  getProvider,
  keyStorageFor,
  modelStorageFor,
  baseUrlStorageFor,
  migrateLegacyStorage,
  effectiveDefaultProviderId,
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
  const [providerId, setProviderId] = useState(DEFAULT_PROVIDER_ID);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [levelIndex, setLevelIndex] = useState(2);
  const [savedFlash, setSavedFlash] = useState('');

  const provider = getProvider(providerId);

  // Load the per-provider values for the currently selected provider. Called on
  // mount and whenever the provider changes, so the key, model, and base-URL
  // fields always reflect the chosen provider's own saved settings.
  function loadProvider(id) {
    const p = getProvider(id);
    try {
      setApiKey(localStorage.getItem(keyStorageFor(p.id)) || '');
      setModel(localStorage.getItem(modelStorageFor(p.id)) || p.defaultModel);
      if (p.id === 'custom') {
        setBaseUrl(
          localStorage.getItem(baseUrlStorageFor(p.id)) || p.defaultBaseUrl
        );
      } else {
        setBaseUrl(p.defaultBaseUrl);
      }
    } catch {
      setApiKey('');
      setModel(p.defaultModel);
      setBaseUrl(p.defaultBaseUrl);
    }
  }

  // Load current values from localStorage on mount. Migrate the legacy Claude
  // key and model into the anthropic slots first, so an existing setup loads
  // with no action.
  useEffect(() => {
    migrateLegacyStorage();
    let savedProvider = DEFAULT_PROVIDER_ID;
    try {
      savedProvider =
        localStorage.getItem(PROVIDER_STORAGE) || effectiveDefaultProviderId();
      const savedLevel = localStorage.getItem(LEVEL_STORAGE);
      setLevelIndex(savedLevel ? indexForLevel(savedLevel) : 2);
    } catch {
      // localStorage unavailable; keep defaults.
    }
    const resolved = getProvider(savedProvider).id;
    setProviderId(resolved);
    loadProvider(resolved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function flash(message) {
    setSavedFlash(message);
    window.setTimeout(() => setSavedFlash(''), 2500);
  }

  // The provider picker saves the moment the reader chooses one, then loads
  // that provider's own saved key, model, and base URL.
  function pickProvider(id) {
    setProviderId(id);
    try {
      localStorage.setItem(PROVIDER_STORAGE, id);
      flash(`Provider set to ${getProvider(id).label}.`);
    } catch {
      flash('This browser would not let the app save the provider.');
    }
    loadProvider(id);
  }

  function saveKey() {
    try {
      const trimmed = apiKey.trim();
      if (trimmed) {
        localStorage.setItem(keyStorageFor(provider.id), trimmed);
        setApiKey(trimmed);
        flash('Key saved in this browser.');
      }
    } catch {
      flash('This browser would not let the app save the key.');
    }
  }

  function clearKey() {
    try {
      localStorage.removeItem(keyStorageFor(provider.id));
    } catch {
      // Nothing to do.
    }
    setApiKey('');
    flash('Key cleared from this browser.');
  }

  function saveModel() {
    try {
      const trimmed = model.trim() || provider.defaultModel;
      localStorage.setItem(modelStorageFor(provider.id), trimmed);
      setModel(trimmed);
      flash('Model saved.');
    } catch {
      flash('This browser would not let the app save the model.');
    }
  }

  function saveBaseUrl() {
    try {
      const trimmed = baseUrl.trim();
      localStorage.setItem(baseUrlStorageFor(provider.id), trimmed);
      setBaseUrl(trimmed);
      flash('Base URL saved.');
    } catch {
      flash('This browser would not let the app save the base URL.');
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

  const isCustom = provider.id === 'custom';

  return (
    <section>
      <h1>Settings</h1>

      <h2>AI provider and key</h2>
      <div className="card">
        <label htmlFor="provider" style={labelStyle}>
          Provider
        </label>
        <select
          id="provider"
          value={providerId}
          onChange={(e) => pickProvider(e.target.value)}
          style={inputStyle}
        >
          {PROVIDERS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <p style={{ margin: 'var(--space-sm) 0 0', color: 'var(--muted)' }}>
          Gemini has a free tier, so it can run at no cost. Claude, GPT, and
          OpenRouter are paid and use your own account. Pick whichever you want;
          switching is instant, and each provider keeps its own key.
        </p>
        {provider.note && (
          <p style={{ margin: 'var(--space-sm) 0 0', color: 'var(--muted)' }}>
            {provider.note}
          </p>
        )}

        <p
          style={{
            margin: 'var(--space-md) 0 0',
            color: 'var(--muted)',
            fontSize: '0.9rem',
          }}
        >
          The partner never invents text. That discipline holds best on strong
          frontier models. A very small or local model may start fabricating
          Talmud text, which is the one thing the partner must never do.
        </p>

        <label
          htmlFor="api-key"
          style={{ ...labelStyle, marginTop: 'var(--space-lg)' }}
        >
          API key
        </label>
        <input
          id="api-key"
          type="password"
          autoComplete="off"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={provider.keyHint || 'your API key'}
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
          The key is stored only in this browser, under this provider. The app
          uses it to call {provider.label} directly and sends it nowhere else.
          There is no server in between, and your own account pays for the calls.
          Each provider keeps its own key, so switching providers does not lose
          the others.
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
          {provider.consoleUrl ? (
            <p
              style={{
                margin: 'var(--space-sm) 0 0',
                lineHeight: 1.7,
              }}
            >
              Open the {provider.label} key page at{' '}
              <a href={provider.consoleUrl} target="_blank" rel="noreferrer">
                {provider.consoleUrl}
              </a>
              , sign in or create an account, create a key, and paste it in the
              field above. Most providers need a little credit on the account
              first, or the key will not work.
            </p>
          ) : (
            <p
              style={{
                margin: 'var(--space-sm) 0 0',
                lineHeight: 1.7,
              }}
            >
              A custom provider is any OpenAI-compatible endpoint. Get a key from
              that host, set the base URL and model below, and paste the key in
              the field above.
            </p>
          )}

          {provider.id === 'anthropic' && (
            <ol
              style={{
                margin: 'var(--space-sm) 0 0',
                paddingLeft: '1.2rem',
                lineHeight: 1.7,
              }}
            >
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
                Add a little credit first, or the key will not work. Under Plans
                and Billing, put a small pay-as-you-go amount on the account.
                Study runs on a few dollars, and this is separate from any Claude
                subscription you already pay for.
              </li>
              <li>
                Go to Settings, then API Keys, and choose Create Key. Name it
                something like Havruta.
              </li>
              <li>
                Copy the key. It starts with{' '}
                <code style={{ fontFamily: 'var(--font-mono)' }}>sk-ant-</code>,
                and you see it only once.
              </li>
              <li>Paste it in the field above and Save.</li>
            </ol>
          )}
        </details>
      </div>

      {isCustom && (
        <>
          <h2>Base URL</h2>
          <div className="card">
            <label htmlFor="base-url" style={labelStyle}>
              Base URL
            </label>
            <input
              id="base-url"
              type="text"
              autoComplete="off"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://your-host.example/v1"
              style={inputStyle}
            />
            <div style={{ marginTop: 'var(--space-md)' }}>
              <button
                type="button"
                className="pill-button pill-button--active"
                onClick={saveBaseUrl}
              >
                Save base URL
              </button>
            </div>
            <p style={{ margin: 'var(--space-md) 0 0', color: 'var(--muted)' }}>
              The partner sends its requests to this base URL followed by{' '}
              <code style={{ fontFamily: 'var(--font-mono)' }}>
                /chat/completions
              </code>
              . Use the OpenAI-compatible base URL your host gives you.
            </p>
          </div>
        </>
      )}

      <h2>Model</h2>
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
          placeholder={provider.defaultModel || 'model name'}
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
          This is the model the partner uses with {provider.label}.{' '}
          {provider.defaultModel ? (
            <>
              The default is{' '}
              <code style={{ fontFamily: 'var(--font-mono)' }}>
                {provider.defaultModel}
              </code>
              .{' '}
            </>
          ) : null}
          You can change it to any model your key can reach. Model names change
          over time, so this field is editable on purpose.
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
