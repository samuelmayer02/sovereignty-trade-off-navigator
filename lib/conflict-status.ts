/**
 * Zulässige Konflikt-Status der Trade-off-Matrix.
 *
 * Die Evaluations-Prompts (`prompts/evaluation_v*.md`) geben die Status in
 * Großschreibung vor (RED/ORANGE/...), die UI vergleicht jedoch case-sensitiv
 * gegen Kleinschreibung. Alle Schreibpfade (Seed, MCP-Server, LLM-Bootstrap)
 * normalisieren deshalb über `normalizeStatus`.
 */
export const CONFLICT_STATUSES = ['red', 'orange', 'green', 'blue'] as const;

export type ConflictStatus = (typeof CONFLICT_STATUSES)[number];

export function normalizeStatus(status: unknown): string {
  return typeof status === 'string' ? status.trim().toLowerCase() : String(status);
}

export function isValidStatus(status: unknown): status is ConflictStatus {
  return (CONFLICT_STATUSES as readonly string[]).includes(normalizeStatus(status));
}
