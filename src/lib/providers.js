// The provider registry.
//
// Havruta runs entirely in the browser. The reader supplies an API key for one
// AI provider, and the app calls that provider directly from the page. There
// are only two wire protocols to support:
//
//   anthropic  the Anthropic Messages API (the original working path)
//   openai     the OpenAI-compatible Chat Completions API, which also covers
//              Google Gemini (its compatibility endpoint), OpenRouter, and any
//              other host that speaks the same shape
//
// Each provider names its protocol, a default base URL, a default model, a hint
// for the key field, where the reader gets a key, and a short note. Every
// default model is editable in Settings. The model strings below are sensible
// current defaults, not promises: a model can be retired or renamed by its
// provider at any time, so the Settings model field is always editable and the
// reader can point it at whatever model their key can reach.

export const PROVIDERS = [
  {
    id: 'anthropic',
    label: 'Claude (Anthropic)',
    protocol: 'anthropic',
    defaultBaseUrl: 'https://api.anthropic.com',
    defaultModel: 'claude-sonnet-4-6',
    keyHint: 'sk-ant-...',
    consoleUrl: 'https://console.anthropic.com/settings/keys',
    note:
      'The default and the partner it was written for. Add a little pay-as-you-go credit to the account first, or the key will not work.',
  },
  {
    id: 'openai',
    label: 'GPT (OpenAI)',
    protocol: 'openai',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4.1',
    keyHint: 'sk-...',
    consoleUrl: 'https://platform.openai.com/api-keys',
    note:
      'OpenAI models. The model name is editable, so you can set it to whatever model your key can reach.',
  },
  {
    id: 'google',
    label: 'Gemini (Google)',
    protocol: 'openai',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.5-pro',
    keyHint: 'AIza...',
    consoleUrl: 'https://aistudio.google.com/apikey',
    note:
      'Google Gemini through its OpenAI-compatible endpoint. The model name is editable; set it to a Gemini model your key can reach.',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter (many models)',
    protocol: 'openai',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'anthropic/claude-sonnet-4.6',
    keyHint: 'sk-or-...',
    consoleUrl: 'https://openrouter.ai/keys',
    note:
      'One OpenRouter key reaches many models, including Claude, GPT, Gemini, and Llama. Set the model name to the one you want; the names are listed on the OpenRouter site.',
  },
  {
    id: 'custom',
    label: 'Custom (OpenAI-compatible)',
    protocol: 'openai',
    defaultBaseUrl: '',
    defaultModel: '',
    keyHint: '',
    consoleUrl: null,
    note:
      'Any OpenAI-compatible endpoint. You supply the base URL and the model name. The partner expects the chat-completions shape at {base URL}/chat/completions.',
  },
];

// The default provider. The partner starts as Claude unless the reader changes
// it, so an existing Claude setup keeps working with no action.
export const DEFAULT_PROVIDER_ID = 'anthropic';

// Look a provider up by id. Falls back to the default provider for an
// unrecognized id so a stale stored value never leaves the app without one.
export function getProvider(id) {
  return (
    PROVIDERS.find((p) => p.id === id) ||
    PROVIDERS.find((p) => p.id === DEFAULT_PROVIDER_ID)
  );
}
