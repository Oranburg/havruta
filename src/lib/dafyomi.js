// Small helpers for working with daf references.
// A daf ref looks like "Chullin 44": a tractate name and a folio number.

// Split a daf ref into its tractate name and folio number.
// "Chullin 44" -> { tractate: "Chullin", daf: "44" }
export function parseRef(ref) {
  const match = /^(.*?)\s+(\d+)$/.exec(String(ref).trim());
  if (!match) {
    return { tractate: String(ref).trim(), daf: '' };
  }
  return { tractate: match[1], daf: match[2] };
}

// The two amud (side) refs for a daf.
// "Chullin 44" -> ["Chullin 44a", "Chullin 44b"]
export function amudRefs(ref) {
  return [`${ref}a`, `${ref}b`];
}
