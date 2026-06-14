// Browser AI client.
//
// This app runs entirely in the browser on GitHub Pages, with no server. The
// reader supplies their own API key for one provider, and this module calls
// that provider's API directly from the page. The key is passed in by the
// caller and never stored here.
//
// Two wire protocols are supported, dispatched by the provider's protocol:
//   anthropic  the Anthropic Messages API (the original working path)
//   openai     the OpenAI-compatible Chat Completions API (OpenAI, Gemini's
//              compatibility endpoint, OpenRouter, and any compatible host)
//
// The single most important rule, from docs/CONSTITUTION.md: the partner never
// invents sacred text. This module only carries the request and stream; the
// system prompt and the supplied daf text enforce that the partner quotes only
// what Sefaria handed it. The same provider-agnostic system prompt is sent to
// every provider, and the never-invent rule is not weakened for any of them. On
// any API error, the caller shows calm copy and never falls back to inventing
// text. A malformed stream line is skipped rather than treated as text, so a
// parse glitch never becomes invented content.

const ANTHROPIC_VERSION = '2023-06-01';
const MAX_TOKENS = 1024;

// Turn an HTTP error response into a readable Error for the reader. The status
// messages are written so they make sense for any provider, not Anthropic only.
async function errorFromResponse(res) {
  let detail = '';
  try {
    const body = await res.json();
    // Anthropic and OpenAI-compatible hosts both nest the message under "error".
    if (body && body.error) {
      if (typeof body.error === 'string') {
        detail = body.error;
      } else if (body.error.message) {
        detail = body.error.message;
      }
    }
  } catch {
    // Body was not JSON. Fall through to a status-based message.
  }

  if (res.status === 401) {
    return new Error(
      'That API key was not accepted. Check it in Settings, then try again.'
    );
  }
  if (res.status === 403) {
    return new Error(
      'That API key is not allowed to call this model. Check the key and model in Settings.'
    );
  }
  if (res.status === 429) {
    return new Error(
      'The request was rate limited or the account is out of credit. Wait a moment, or check your account with the provider, then try again.'
    );
  }
  if (res.status >= 500) {
    return new Error(
      'The provider returned a server error. This is on their end. Try again in a moment.'
    );
  }
  return new Error(detail || `The request failed with status ${res.status}.`);
}

// Read a Server-Sent Events body line by line, calling onLine for each "data:"
// payload string (already stripped of the "data:" prefix and trimmed). Returns
// when the body ends. This is shared by both protocols, which differ only in
// how they interpret each data payload.
async function readSse(res, onLine) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    // Keep the last (possibly partial) line in the buffer for the next read.
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (!data) continue;
      // onLine may signal completion by returning true.
      if (onLine(data)) return;
    }
  }
}

// Stream from the Anthropic Messages API. SSE events: content_block_delta with a
// text_delta carries text; message_stop ends the stream.
async function streamAnthropic({
  baseUrl,
  apiKey,
  model,
  system,
  messages,
  signal,
  onText,
}) {
  const endpoint = `${baseUrl.replace(/\/$/, '')}/v1/messages`;
  const res = await fetch(endpoint, {
    method: 'POST',
    signal,
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: MAX_TOKENS,
      system,
      messages,
      stream: true,
    }),
  });

  if (!res.ok) throw await errorFromResponse(res);
  if (!res.body) throw new Error('The response carried no stream to read.');

  await readSse(res, (data) => {
    let event;
    try {
      event = JSON.parse(data);
    } catch {
      // A malformed data line is skipped rather than treated as text, so a
      // parse glitch never becomes invented content.
      return false;
    }

    if (event.type === 'error') {
      const message =
        event.error && event.error.message
          ? event.error.message
          : 'The stream reported an error.';
      throw new Error(message);
    }

    if (
      event.type === 'content_block_delta' &&
      event.delta &&
      event.delta.type === 'text_delta' &&
      typeof event.delta.text === 'string'
    ) {
      if (onText) onText(event.delta.text);
    }

    if (event.type === 'message_stop') return true;
    return false;
  });
}

// Stream from an OpenAI-compatible Chat Completions API. The system prompt is
// sent as the first message with role "system", followed by the conversation.
// SSE lines carry choices[0].delta.content; the literal line "[DONE]" ends it.
async function streamOpenAi({
  baseUrl,
  apiKey,
  model,
  system,
  messages,
  signal,
  onText,
}) {
  const endpoint = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  const openAiMessages = [{ role: 'system', content: system }, ...messages];

  const res = await fetch(endpoint, {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: openAiMessages,
      stream: true,
    }),
  });

  if (!res.ok) throw await errorFromResponse(res);
  if (!res.body) throw new Error('The response carried no stream to read.');

  await readSse(res, (data) => {
    if (data === '[DONE]') return true;

    let event;
    try {
      event = JSON.parse(data);
    } catch {
      // A malformed data line is skipped rather than treated as text, so a
      // parse glitch never becomes invented content.
      return false;
    }

    if (event.error) {
      const message =
        typeof event.error === 'string'
          ? event.error
          : event.error.message || 'The stream reported an error.';
      throw new Error(message);
    }

    const choice =
      event.choices && event.choices.length > 0 ? event.choices[0] : null;
    if (
      choice &&
      choice.delta &&
      typeof choice.delta.content === 'string' &&
      choice.delta.content.length > 0
    ) {
      if (onText) onText(choice.delta.content);
    }
    return false;
  });
}

// Stream a havruta exchange from the selected provider.
//
// Options:
//   provider an object from the registry with at least { protocol }
//   baseUrl  the base URL to call (provider default, or the reader's own)
//   apiKey   the reader's API key (passed in, never stored here)
//   model    the model id, e.g. "claude-sonnet-4-6" or "gpt-4.1"
//   system   the partner's system prompt (full string, same for every provider)
//   messages the conversation history as [{ role, content }]
//   signal   an optional AbortSignal to stop a stream
//   onText   called with each chunk of streamed text as it arrives
//   onDone   called once when the stream completes
//   onError  called with an Error if anything fails
export async function streamPartner({
  provider,
  baseUrl,
  apiKey,
  model,
  system,
  messages,
  signal,
  onText,
  onDone,
  onError,
}) {
  try {
    const protocol = provider && provider.protocol ? provider.protocol : 'anthropic';
    const common = { baseUrl, apiKey, model, system, messages, signal, onText };

    if (protocol === 'openai') {
      await streamOpenAi(common);
    } else {
      await streamAnthropic(common);
    }

    // The stream ended (with or without an explicit terminator). Treat the end
    // of the body as completion.
    if (onDone) onDone();
  } catch (err) {
    // An aborted stream is a deliberate stop by the reader, not a failure.
    if (err && err.name === 'AbortError') {
      if (onDone) onDone();
      return;
    }
    const error = err instanceof Error ? err : new Error(String(err));
    if (onError) onError(error);
  }
}

// The original Anthropic-only entry point, kept working so nothing that imports
// it breaks. It delegates to streamPartner on the Anthropic path with the
// default Anthropic base URL.
export async function streamHavruta(options) {
  return streamPartner({
    ...options,
    provider: { protocol: 'anthropic' },
    baseUrl: options.baseUrl || 'https://api.anthropic.com',
  });
}
