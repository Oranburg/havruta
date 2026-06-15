// Export a havruta exchange as Markdown the reader can keep.
//
// Two sources. The live panel exports the visible conversation (the turns array).
// The Archive exports a saved session (the stored messages), skipping the first
// user message because it carries the whole daf as context, not something the
// reader wants in a transcript, and showing the reader's own reading from the
// stored readings instead.

function header(lines, { dafDisplay, segmentLabel, savedAt }) {
  const title = segmentLabel
    ? `${dafDisplay || 'daf yomi'}, ${segmentLabel}`
    : dafDisplay || 'daf yomi';
  lines.push(`# Havruta study: ${title}`, '');
  if (savedAt) {
    try {
      lines.push(`*${new Date(savedAt).toLocaleString()}*`, '');
    } catch {
      // No date available; skip it.
    }
  }
}

function footer(lines, dafDisplay) {
  lines.push('---', '');
  lines.push(`Studied with Havruta. Text from Sefaria.${dafDisplay ? ` ${dafDisplay}.` : ''}`, '');
}

// From the live, visible conversation: turns of { role: 'reader' | 'partner', text }.
export function turnsToMarkdown({ dafDisplay, segmentLabel, turns }) {
  const lines = [];
  header(lines, { dafDisplay, segmentLabel });
  lines.push('## The exchange', '');
  for (const t of turns || []) {
    if (!t || !t.text) continue;
    const who = t.role === 'partner' ? 'Havruta' : 'You';
    lines.push(`**${who}:**`, '', String(t.text).trim(), '');
  }
  footer(lines, dafDisplay);
  return lines.join('\n');
}

// From a saved session: messages of { role: 'user' | 'assistant', content }.
export function sessionToMarkdown(s) {
  if (!s) return '';
  const lines = [];
  header(lines, {
    dafDisplay: s.dafDisplay || s.dafRef,
    segmentLabel: s.segmentLabel,
    savedAt: s.savedAt,
  });

  const reading =
    Array.isArray(s.readings) && s.readings.length ? s.readings[0] : '';
  if (reading) lines.push('## My reading', '', reading.trim(), '');

  lines.push('## The exchange', '');
  const msgs = Array.isArray(s.messages) ? s.messages : [];
  for (let i = 0; i < msgs.length; i += 1) {
    const m = msgs[i];
    if (!m || !m.content) continue;
    // The first user message is the daf-context block, not part of the chat.
    if (i === 0 && m.role === 'user') continue;
    const who = m.role === 'assistant' ? 'Havruta' : 'You';
    lines.push(`**${who}:**`, '', String(m.content).trim(), '');
  }

  footer(lines, s.dafDisplay || s.dafRef);
  return lines.join('\n');
}

// A safe .md file name from a label.
export function fileNameFor(label) {
  const safe = String(label || 'havruta')
    .replace(/[^\w-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `havruta-${safe || 'session'}.md`;
}

// Trigger a download of markdown text as a .md file.
export function downloadMarkdown(filename, markdown) {
  try {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    // Download unavailable in this environment; nothing else to do.
  }
}
