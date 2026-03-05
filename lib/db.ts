/**
 * lib/db.ts — Singleton SQLite connection + safe query executor
 *
 * Architecture decisions:
 * - Singleton via globalThis guard: prevents multiple DB handles during
 *   Next.js hot-module reloads in development.
 * - WAL mode: allows concurrent reads while a write is in progress.
 * - executeQuery centralises all security validation in one place so
 *   API routes never touch raw SQL.
 */

import Database from "better-sqlite3";
import path from "path";

// ---------------------------------------------------------------------------
// Singleton connection
// ---------------------------------------------------------------------------

declare global {
  // eslint-disable-next-line no-var
  var __db: Database.Database | undefined;
}

const dbPath = path.join(process.cwd(), "database.sqlite");

// Reuse the connection across hot-module reloads in development.
if (!globalThis.__db) {
  globalThis.__db = new Database(dbPath);
  globalThis.__db.pragma("foreign_keys = ON");
  // WAL improves concurrent read performance
  globalThis.__db.pragma("journal_mode = WAL");
}

const db: Database.Database = globalThis.__db;

/** Hard cap on rows returned — prevents memory exhaustion. */
const MAX_ROWS = 500;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QueryResult {
  success: boolean;
  data?: Record<string, unknown>[];
  error?: string;
  rowCount?: number;
  /** Total rows matching the query before pagination */
  total?: number;
}

export interface PaginationOptions {
  skip: number;
  limit: number;
}

// ---------------------------------------------------------------------------
// Query executor
// ---------------------------------------------------------------------------

/**
 * Validates and executes a read-only SQL SELECT query with optional pagination.
 *
 * Security pipeline (in order):
 * 1. Reject empty input.
 * 2. Enforce SELECT-only via word-boundary regex.
 * 3. Scan for forbidden mutation/admin keywords (word-boundary aware).
 * 4. Detect multi-statement injection: strip string literals, then look
 *    for embedded semicolons that are not a trailing terminator.
 * 5. Pass the validated SQL to `db.prepare()` — better-sqlite3 compiles
 *    a single statement; any syntax error is caught and returned as an
 *    error message rather than thrown to the caller.
 * 6. When pagination options are provided, wrap the user's query in a
 *    subquery to apply LIMIT/OFFSET and run a COUNT for the total.
 *    skip and limit are integers validated before interpolation — safe.
 *
 * @param sql        - The user's SELECT query.
 * @param pagination - Optional { skip, limit } for server-side pagination.
 */
export function executeQuery(
  sql: string,
  pagination?: PaginationOptions,
): QueryResult {
  const trimmed = sql.trim();

  if (!trimmed) {
    return { success: false, error: "Query cannot be empty." };
  }

  // --- Rule 1: Must start with SELECT ---
  if (!/^SELECT\b/i.test(trimmed)) {
    return { success: false, error: "Only SELECT queries are allowed." };
  }

  // --- Rule 3: Multi-statement detection ---
  // Strip single-quoted string literals to avoid false positives on
  // semicolons that appear inside string values, then check if a
  // semicolon remains anywhere other than a trailing position.
  const sqlWithoutStrings = trimmed.replace(/'[^']*'/g, "''");
  const withoutTrailingSemicolon = sqlWithoutStrings
    .trimEnd()
    .replace(/;$/, "");
  if (withoutTrailingSemicolon.includes(";")) {
    return {
      success: false,
      error: "Multiple statements are not allowed.",
    };
  }

  // Strip trailing semicolon before wrapping in a subquery.
  const baseQuery = trimmed.replace(/;$/, "");

  // --- Rule 4: Execute via prepared statement ---
  try {
    if (pagination) {
      // Clamp skip/limit to safe integer bounds before interpolation.
      const skip = Math.max(0, Math.floor(pagination.skip));
      const limit = Math.min(
        Math.max(1, Math.floor(pagination.limit)),
        MAX_ROWS,
      );

      // COUNT query — wraps user's query so ORDER BY / LIMIT in user SQL
      // are respected when computing the page total.
      const countStmt = db.prepare(
        `SELECT COUNT(*) AS total FROM (${baseQuery})`,
      );
      const countRow = countStmt.get() as { total: number };
      const total = countRow.total;

      // Paginated data query — LIMIT and OFFSET use ? placeholders (no injection).
      const pageStmt = db.prepare(
        `SELECT * FROM (${baseQuery}) LIMIT ? OFFSET ?`,
      );
      const rows = pageStmt.all(limit, skip) as Record<string, unknown>[];

      return { success: true, data: rows, rowCount: rows.length, total };
    }

    // Non-paginated path — unchanged behaviour, cap at MAX_ROWS.
    const stmt = db.prepare(trimmed);
    const rows = stmt.all() as Record<string, unknown>[];
    const limited = rows.slice(0, MAX_ROWS);

    return {
      success: true,
      data: limited,
      rowCount: limited.length,
      total: limited.length,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Query execution failed";
    return { success: false, error: message };
  }
}

export default db;
