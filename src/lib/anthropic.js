// Browser AI client with Sefaria tool use.
//
// This app runs entirely in the browser on GitHub Pages, with no server. The
// reader supplies their own API key for one provider, and this module calls that
// provider's API directly from the page. The key is passed in by the caller and
// never stored here.
//
// Two wire protocols are supported, dispatched by the provider's protocol:
//   anthropic  the Anthropic Messages API
//   openai     the OpenAI-compatible Chat Completions API (OpenAI, Gemini's
//              compatibility endpoint, OpenRouter, and any compatible host)
//
// The partner can call Sefaria tools (src/lib/sefariaTools.js) during a turn: it
// asks for a passage's cross-references, reads a parallel sugya or a cited verse,
// searches the library, or looks a word up, and this module runs that call
// against Sefaria and feeds the verbatim result back, looping until the partner
// has what it needs and answers. The tools reach only Sefaria, and there is no
// open-web tool, so the partner cannot pull non-canonical sources. The
// never-invent rule of docs/CONSTITUTION.md holds: the partner quotes only text a
// tool returned or text it was handed, and a malformed stream line or a failed
// lookup never becomes invented content.

import {
  toAnthropicTools,
  toOpenAiTools,
  runSefariaTool,
  describeToolCall,
} from './sefariaTools.js';

const ANTHROPIC_VERSION = '2023-06-01';
const MAX_TOKENS = 1500;
// A backstop against a tool loop that never settles. After this many rounds the
// next turn runs without tools, forcing the partner to answer with what it has.
const MAX_TOOL_ROUNDS = 6;

async function errorFromResponse(res) {
  let detail = '';
  try {
    const body = await res.json();
    if (body && body.error) {
      if (typeof body.error === 'string') detail = body.error;
      else if (body.error.message) detail = body.error.message;
    }
  } catch {
    // Body was not JSON. Fall through to a status-based message.
  }

  if (res.status === 401) {
    return new Error('That API key was not accepted. Check it in Settings, then try again.');
  }
  if (res.status === 403) {
    return new Error('That API key is not allowed to call this model. Check the key and model in Settings.');
  }
  if (res.status === 429) {
    return new Error('The request was rate limited or the account is out of credit. Wait a moment, or check your account with the provider, then try again.');
  }
  if (res.status >= 500) {
    return new Error('The provider returned a server error. This is on their end. Try again in a moment.');
  }
  return new Error(detail || `The request failed with status ${res.status}.`);
}

// Read a Server-Sent Events body line by line, calling onLine for each "data:"
// payload (stripped of the prefix and trimmed). onLine returns true to stop.
async function readSse(res, onLine) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (!data) continue;
      if (onLine(data)) return;
    }
  }
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// One streamed turn, Anthropic. Streams text via onText and returns the full
// assistant content (text and tool_use blocks) plus the stop reason, so the
// caller can run any tool calls and continue.
// ---------------------------------------------------------------------------
async function streamAnthropicTurn({
  baseUrl,
  apiKey,
  model,
  system,
  messages,
  signal,
  onText,
  tools,
}) {
  const endpoint = `${baseUrl.replace(/\/$/, '')}/v1/messages`;
  const body = {
    model,
    max_tokens: MAX_TOKENS,
    system,
    messages,
    stream: true,
  };
  if (tools) body.tools = tools;

  const res = await fetch(endpoint, {
    method: 'POST',
    signal,
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw await errorFromResponse(res);
  if (!res.body) throw new Error('The response carried no stream to read.');

  // Content blocks by index, assembled as the stream arrives.
  const blocks = {};
  let stopReason = null;

  await readSse(res, (data) => {
    const event = safeJsonParse(data, null);
    if (!event) return false;

    if (event.type === 'error') {
      const message = event.error && event.error.message ? event.error.message : 'The stream reported an error.';
      throw new Error(message);
    }

    if (event.type === 'content_block_start') {
      const cb = event.content_block || {};
      if (cb.type === 'tool_use') {
        blocks[event.index] = { type: 'tool_use', id: cb.id, name: cb.name, jsonBuf: '' };
      } else if (cb.type === 'text') {
        blocks[event.index] = { type: 'text', text: '' };
      }
      return false;
    }

    if (event.type === 'content_block_delta' && event.delta) {
      const b = blocks[event.index];
      if (event.delta.type === 'text_delta' && typeof event.delta.text === 'string') {
        if (b && b.type === 'text') b.text += event.delta.text;
        if (onText) onText(event.delta.text);
      } else if (event.delta.type === 'input_json_delta' && typeof event.delta.partial_json === 'string') {
        if (b && b.type === 'tool_use') b.jsonBuf += event.delta.partial_json;
      }
      return false;
    }

    if (event.type === 'message_delta' && event.delta && event.delta.stop_reason) {
      stopReason = event.delta.stop_reason;
      return false;
    }

    if (event.type === 'message_stop') return true;
    return false;
  });

  // Assemble the assistant content in index order.
  const assistantContent = [];
  for (const key of Object.keys(blocks).map(Number).sort((a, b) => a - b)) {
    const b = blocks[key];
    if (b.type === 'text') {
      if (b.text) assistantContent.push({ type: 'text', text: b.text });
    } else if (b.type === 'tool_use') {
      assistantContent.push({
        type: 'tool_use',
        id: b.id,
        name: b.name,
        input: safeJsonParse(b.jsonBuf || '{}', {}),
      });
    }
  }

  return { assistantContent, stopReason };
}

// ---------------------------------------------------------------------------
// One streamed turn, OpenAI-compatible. Streams text via onText and returns the
// assistant message plus any tool calls and the finish reason.
// ---------------------------------------------------------------------------
async function streamOpenAiTurn({
  baseUrl,
  apiKey,
  model,
  messages,
  signal,
  onText,
  tools,
}) {
  const endpoint = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  const body = {
    model,
    messages,
    stream: true,
  };
  if (tools) {
    body.tools = tools;
    body.tool_choice = 'auto';
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw await errorFromResponse(res);
  if (!res.body) throw new Error('The response carried no stream to read.');

  let text = '';
  let finishReason = null;
  const calls = []; // by index: { id, name, args }

  await readSse(res, (data) => {
    if (data === '[DONE]') return true;

    const event = safeJsonParse(data, null);
    if (!event) return false;

    if (event.error) {
      const message = typeof event.error === 'string' ? event.error : event.error.message || 'The stream reported an error.';
      throw new Error(message);
    }

    const choice = event.choices && event.choices.length > 0 ? event.choices[0] : null;
    if (!choice) return false;

    const delta = choice.delta || {};
    if (typeof delta.content === 'string' && delta.content.length > 0) {
      text += delta.content;
      if (onText) onText(delta.content);
    }

    if (Array.isArray(delta.tool_calls)) {
      for (const tc of delta.tool_calls) {
        const idx = typeof tc.index === 'number' ? tc.index : calls.length;
        if (!calls[idx]) calls[idx] = { id: '', name: '', args: '' };
        if (tc.id) calls[idx].id = tc.id;
        if (tc.function) {
          if (tc.function.name) calls[idx].name = tc.function.name;
          if (typeof tc.function.arguments === 'string') calls[idx].args += tc.function.arguments;
        }
      }
    }

    if (choice.finish_reason) finishReason = choice.finish_reason;
    return false;
  });

  const toolCalls = calls.filter(Boolean).filter((c) => c.name);
  const assistantMessage = { role: 'assistant', content: text || null };
  if (toolCalls.length > 0) {
    assistantMessage.tool_calls = toolCalls.map((c) => ({
      id: c.id,
      type: 'function',
      function: { name: c.name, arguments: c.args || '{}' },
    }));
  }

  return { assistantMessage, toolCalls, finishReason, text };
}

// ---------------------------------------------------------------------------
// Stream a havruta exchange, running Sefaria tool calls until the partner
// answers.
//
// Options add to the earlier set:
//   onStatus  called with a short string while a tool runs, and with null when
//             it finishes; the UI shows it as a transient "consulting Sefaria"
//             line. Optional.
//   useTools  enable Sefaria tool use (default true).
// ---------------------------------------------------------------------------
export async function streamPartner({
  provider,
  baseUrl,
  apiKey,
  model,
  system,
  messages,
  signal,
  onText,
  onStatus,
  onDone,
  onError,
  useTools = true,
}) {
  try {
    const protocol = provider && provider.protocol ? provider.protocol : 'anthropic';

    if (protocol === 'openai') {
      const working = [{ role: 'system', content: system }, ...messages];
      for (let round = 0; round <= MAX_TOOL_ROUNDS; round += 1) {
        const allowTools = useTools && round < MAX_TOOL_ROUNDS;
        const r = await streamOpenAiTurn({
          baseUrl,
          apiKey,
          model,
          messages: working,
          signal,
          onText,
          tools: allowTools ? toOpenAiTools() : null,
        });
        if (r.toolCalls.length === 0) {
          if (onDone) onDone();
          return;
        }
        working.push(r.assistantMessage);
        for (const tc of r.toolCalls) {
          const input = safeJsonParse(tc.args || '{}', {});
          if (onStatus) onStatus(describeToolCall(tc.name, input));
          const result = await runSefariaTool(tc.name, input);
          working.push({ role: 'tool', tool_call_id: tc.id, content: result });
        }
        if (onStatus) onStatus(null);
      }
      if (onDone) onDone();
      return;
    }

    // Anthropic.
    const working = [...messages];
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round += 1) {
      const allowTools = useTools && round < MAX_TOOL_ROUNDS;
      const r = await streamAnthropicTurn({
        baseUrl,
        apiKey,
        model,
        system,
        messages: working,
        signal,
        onText,
        tools: allowTools ? toAnthropicTools() : null,
      });
      if (r.stopReason !== 'tool_use') {
        if (onDone) onDone();
        return;
      }
      working.push({ role: 'assistant', content: r.assistantContent });
      const toolResults = [];
      for (const block of r.assistantContent) {
        if (block.type !== 'tool_use') continue;
        if (onStatus) onStatus(describeToolCall(block.name, block.input));
        const result = await runSefariaTool(block.name, block.input);
        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result });
      }
      working.push({ role: 'user', content: toolResults });
      if (onStatus) onStatus(null);
    }
    if (onDone) onDone();
  } catch (err) {
    if (err && err.name === 'AbortError') {
      if (onStatus) onStatus(null);
      if (onDone) onDone();
      return;
    }
    const error = err instanceof Error ? err : new Error(String(err));
    if (onStatus) onStatus(null);
    if (onError) onError(error);
  }
}
