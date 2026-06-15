// The Sefaria tools the study partner can call during a conversation.
//
// These are the only way the partner reaches text it was not handed. Every tool
// hits Sefaria and nothing else, so the partner cannot wander to non-canonical
// sources; it has no open-web tool at all. It still quotes only what these tools
// return, verbatim, so the never-invent rule of docs/CONSTITUTION.md holds even
// as the partner ranges across the whole library.
//
// The toolset is led by sefaria_links, because Sefaria has already done the
// cross-referencing: for any line it returns the curated parallel Talmud sugyot
// and the Tanakh verses the line cites, so the partner finds connections without
// guessing. sefaria_search is the fallback for a phrase or concept, with the
// query drawn from the words of the text.

import {
  getLinksForRef,
  getSefariaText,
  searchSefaria,
  lookupWord,
} from './sefaria.js';

// Provider-neutral tool specs. anthropic.js adapts these to each wire format.
export const SEFARIA_TOOLS = [
  {
    name: 'sefaria_links',
    description:
      'List the cross-references Sefaria connects to a passage: parallel Talmud sugyot, the Tanakh verses it cites, its commentaries (Rashi, Tosafot, and others), halakhic codes, Kabbalah, and Midrash. Use this FIRST to find where else in the canon a line is treated; Sefaria has already curated these links, so you do not guess. Returns reference names you then read with sefaria_text.',
    parameters: {
      type: 'object',
      properties: {
        ref: {
          type: 'string',
          description:
            'A Sefaria reference, for example "Chullin 45a:2", "Genesis 1:1", or "Rashi on Chullin 45a:2".',
        },
      },
      required: ['ref'],
    },
  },
  {
    name: 'sefaria_text',
    description:
      'Fetch the verbatim Hebrew/Aramaic and English text of any Sefaria reference. This is the only way to quote text you were not handed; quote only what it returns. Use it to read a parallel sugya, a cited verse, or a commentary you found through sefaria_links or sefaria_search.',
    parameters: {
      type: 'object',
      properties: {
        ref: {
          type: 'string',
          description:
            'A Sefaria reference, for example "Bava Kamma 2a", "Leviticus 19:18", or "Rashi on Chullin 45a:2".',
        },
      },
      required: ['ref'],
    },
  },
  {
    name: 'sefaria_search',
    description:
      'Full-text search across the Sefaria library (Tanakh, Talmud, Midrash, halakhah, Kabbalah, commentaries). Use it only when a connection is not a formal link: a phrase, a concept, or a term discussed elsewhere. Build the query from the words of the text in front of you, not from a guess. Returns matching references with a short snippet; read the full text with sefaria_text.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'A Hebrew, Aramaic, or English search phrase taken from or about the text.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'sefaria_lexicon',
    description:
      "Look a Hebrew or Aramaic word up in Sefaria's dictionaries (Jastrow for rabbinic Aramaic, BDB and Klein for biblical Hebrew). Use it for philology: the plain sense and the range of a word that is doing work in the argument.",
    parameters: {
      type: 'object',
      properties: {
        word: {
          type: 'string',
          description: 'A single Hebrew or Aramaic word.',
        },
      },
      required: ['word'],
    },
  },
];

// Adapters to the two wire formats.
export function toAnthropicTools() {
  return SEFARIA_TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters,
  }));
}

export function toOpenAiTools() {
  return SEFARIA_TOOLS.map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));
}

// A short, human-readable status line for a tool call, shown while it runs.
export function describeToolCall(name, input) {
  const i = input || {};
  if (name === 'sefaria_links') return `Finding cross-references for ${i.ref || 'the line'} on Sefaria`;
  if (name === 'sefaria_text') return `Reading ${i.ref || 'a passage'} on Sefaria`;
  if (name === 'sefaria_search') return `Searching Sefaria for “${i.query || ''}”`;
  if (name === 'sefaria_lexicon') return `Looking up ${i.word || 'a word'} in the dictionary`;
  return 'Consulting Sefaria';
}

// Strip HTML for tool output, matching the data layer.
function strip(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

const MAX_TEXT = 3500; // cap a single fetched passage so context stays sane

async function toolLinks(ref) {
  const b = await getLinksForRef(ref);
  const order = [
    ['Parallel Talmud', b.talmud],
    ['Tanakh (cited verses)', b.tanakh],
    ['Commentaries', b.commentary],
    ['Halakhah', b.halakhah],
    ['Kabbalah', b.kabbalah],
    ['Midrash', b.midrash],
    ['Other', b.other],
  ];
  const lines = [`Cross-references Sefaria connects to ${ref}:`];
  for (const [label, arr] of order) {
    if (!arr || arr.length === 0) continue;
    const refs = arr.slice(0, 8).map((e) => e.ref);
    lines.push(`${label}: ${refs.join('; ')}`);
  }
  if (lines.length === 1) {
    lines.push('No cross-references are recorded for this reference.');
  }
  return lines.join('\n');
}

async function toolText(ref) {
  const d = await getSefariaText(ref);
  if (!d || (d.he.length === 0 && d.en.length === 0)) {
    return `Sefaria returned no text for ${ref}. Do not invent it; tell the learner it is not available.`;
  }
  const he = d.he.map(strip).join(' ').trim();
  const en = d.en.join(' ').trim();
  let out = `${d.ref}\nHebrew/Aramaic: ${he}\nEnglish: ${en}`;
  if (out.length > MAX_TEXT) out = `${out.slice(0, MAX_TEXT)} …[truncated]`;
  return out;
}

async function toolSearch(query) {
  const hits = await searchSefaria(query, 6);
  if (hits.length === 0) {
    return `No Sefaria results for "${query}". Do not invent a source; say you could not find one.`;
  }
  const lines = [`Sefaria search results for "${query}":`];
  for (const h of hits) {
    const snip = h.snippet ? `: ${h.snippet}` : '';
    lines.push(`- ${h.ref}${snip}`.slice(0, 280));
  }
  return lines.join('\n');
}

async function toolLexicon(word) {
  const r = await lookupWord(word);
  if (!r.found) {
    return `Sefaria's dictionaries carry no entry for ${word} under the forms tried.`;
  }
  const lines = [`Dictionary for ${r.word}:`];
  for (const e of r.entries.slice(0, 3)) {
    lines.push(`${e.lexicon} (${e.headword}): ${e.senses.slice(0, 4).join('; ')}`);
  }
  return lines.join('\n').slice(0, 1500);
}

// Execute one tool call and return a string result for the model. Never throws:
// a failure returns a message telling the partner not to invent, so a lookup
// error can never become fabricated text.
export async function runSefariaTool(name, input) {
  const i = input || {};
  try {
    if (name === 'sefaria_links') return await toolLinks(String(i.ref || ''));
    if (name === 'sefaria_text') return await toolText(String(i.ref || ''));
    if (name === 'sefaria_search') return await toolSearch(String(i.query || ''));
    if (name === 'sefaria_lexicon') return await toolLexicon(String(i.word || ''));
    return `No such tool: ${name}.`;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return `That Sefaria lookup failed (${msg}). Do not invent the text; tell the learner you could not retrieve it.`;
  }
}
