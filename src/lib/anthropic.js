// Browser Anthropic client.
//
// This app runs entirely in the browser on GitHub Pages, with no server. The
// reader supplies their own Anthropic API key, and this module calls the
// Anthropic Messages API directly from the page. The key is passed in by the
// caller and never stored here.
//
// The single most important rule, from docs/CONSTITUTION.md: the partner never
// invents sacred text. This module only carries the request and stream; the
// system prompt and the supplied daf text enforce that the partner quotes only
// what Sefaria handed it. On any API error, the caller shows calm copy and
// never falls back to inventing text.

const ENDPOINT = 'https://api.anthropic.com/v1/messages';

// Turn an HTTP error response into a readable Error for the reader.
async function errorFromResponse(res) {
  let detail = '';
  try {
    const body = await res.json();
    if (body && body.error && body.error.message) {
      detail = body.error.message;
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
      'That API key is not allowed to call this model. Check the key in Settings.'
    );
  }
  if (res.status === 429) {
    return new Error(
      'The request was rate limited or the account is out of credit. Wait a moment, or check your Anthropic account, then try again.'
    );
  }
  if (res.status >= 500) {
    return new Error(
      'Anthropic returned a server error. This is on their end. Try again in a moment.'
    );
  }
  return new Error(
    detail || `The request failed with status ${res.status}.`
  );
}

// Stream a havruta exchange from the Anthropic Messages API.
//
// Options:
//   apiKey   the reader's Anthropic API key (passed in, never stored here)
//   model    the Claude model id, e.g. "claude-sonnet-4-6"
//   system   the partner's system prompt (full string)
//   messages the conversation history as [{ role, content }]
//   signal   an optional AbortSignal to stop a stream
//   onText   called with each chunk of streamed text as it arrives
//   onDone   called once when the stream completes
//   onError  called with an Error if anything fails
export async function streamHavruta({
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
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      signal,
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system,
        messages,
        stream: true,
      }),
    });

    if (!res.ok) {
      throw await errorFromResponse(res);
    }
    if (!res.body) {
      throw new Error('The response carried no stream to read.');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // Read the Server-Sent Events stream. Lines starting with "data: " carry a
    // JSON event. On a content_block_delta with a text_delta, emit the text; on
    // message_stop, finish.
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

        let event;
        try {
          event = JSON.parse(data);
        } catch {
          // A malformed data line is skipped rather than treated as text, so a
          // parse glitch never becomes invented content.
          continue;
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

        if (event.type === 'message_stop') {
          if (onDone) onDone();
          return;
        }
      }
    }

    // The stream ended without an explicit message_stop. Treat the end of the
    // body as completion.
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
