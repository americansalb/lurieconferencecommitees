// Parses @mentions from a discussion post body and resolves them to user IDs
// among the committee membership. Supports three styles:
//   @firstname             — single token, matches first word of full name
//   @firstnamelastname     — concatenated, matches full name with spaces removed
//   @"First Last"          — quoted, matches full name verbatim
// All matching is case-insensitive. If a token resolves to multiple users,
// they're all mentioned.

export type MentionCandidate = { id: string; name: string };

const MENTION_RE = /@(?:"([^"]+)"|([A-Za-z][A-Za-z0-9._-]*))/g;

export function extractMentionTokens(body: string): string[] {
  const tokens: string[] = [];
  const matches = Array.from(body.matchAll(MENTION_RE));
  for (const m of matches) {
    const tok = (m[1] || m[2] || "").trim();
    if (tok) tokens.push(tok);
  }
  return Array.from(new Set(tokens));
}

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "");
}

export function resolveMentions(
  body: string,
  candidates: MentionCandidate[]
): string[] {
  const tokens = extractMentionTokens(body);
  if (!tokens.length || !candidates.length) return [];

  const matched = new Set<string>();
  for (const tok of tokens) {
    const tokNorm = norm(tok);
    const tokLower = tok.toLowerCase();
    for (const c of candidates) {
      const nameNorm = norm(c.name);
      const firstName = c.name.split(/\s+/)[0]?.toLowerCase() || "";
      if (
        nameNorm === tokNorm ||
        c.name.toLowerCase() === tokLower ||
        (firstName && firstName === tokLower)
      ) {
        matched.add(c.id);
      }
    }
  }
  return Array.from(matched);
}
