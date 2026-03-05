/**
 * types/api.ts — Shared API contract types
 *
 * Kept in src/types so they are importable from both the API route
 * (server) and the page component (client) via the "@/*" tsconfig alias.
 */

/** Shape returned by GET /api/query */
export interface ApiResponse {
  success: boolean;
  /** Rows returned by the query (present when success = true) */
  data?: Record<string, unknown>[];
  /** Human-readable error message (present when success = false) */
  error?: string;
  /** Number of rows in the current page */
  rowCount?: number;
  /** Total rows matching the query (before pagination) */
  total?: number;
}
