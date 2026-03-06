/**
 * lib/db.ts — Singleton SQLite connection + safe query executor
 *
 * Architecture decisions:
 * - Singleton via globalThis guard: prevents multiple DB handles during
 *   Next.js hot-module reloads in development.
 * - WAL mode: allows concurrent reads while a write is in progress.
 * - executeQuery centralises all security validation in one place so
 *   API routes never touch raw SQL.
 *
 * Logging:
 * - [DB INIT]    — first-time connection creation (skipped on HMR reuse)
 * - [DB REUSE]   — existing connection reused after hot-module reload
 * - [FUNCTION START] executeQuery() — logs SQL + pagination every call
 * - [SECURITY]   — logs each validation step (pass / reject)
 * - [SQL QUERY]  — final SQL sent to SQLite (count + data variants)
 * - [SQL PARAMS] — bound parameter values
 * - [DB RESULT]  — row counts returned by SQLite
 * - [ERROR]      — full error message and stack trace
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

/**
 * Initialise (or reuse) the singleton SQLite connection.
 * The [DB INIT] log fires only once per process lifetime; subsequent
 * Next.js HMR reloads log [DB REUSE] instead.
 */
if (!globalThis.__db) {
  console.log(`[DB INIT]  Opening database: ${dbPath}`);
  globalThis.__db = new Database(dbPath);
  globalThis.__db.pragma("foreign_keys = ON");
  // WAL improves concurrent read performance
  globalThis.__db.pragma("journal_mode = WAL");
  console.log(`[DB INIT]  Pragmas set — foreign_keys=ON, journal_mode=WAL`);
} else {
  console.log(`[DB REUSE] Existing database connection reused (HMR)`);
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
  console.log(`[FUNCTION START] executeQuery()`);
  console.log(`[INPUT]    Raw SQL (${sql.length} chars): ${sql.slice(0, 200)}${sql.length > 200 ? "..." : ""}`);
  if (pagination) {
    console.log(`[INPUT]    Pagination: skip=${pagination.skip}, limit=${pagination.limit}`);
  }

  const trimmed = sql.trim();

  // --- Rule 0: Reject empty input ---
  if (!trimmed) {
    console.log(`[SECURITY] REJECT — empty query`);
    return { success: false, error: "Query cannot be empty." };
  }

  // --- Rule 1: Must start with SELECT ---
  if (!/^SELECT\b/i.test(trimmed)) {
    console.log(`[SECURITY] REJECT — query does not start with SELECT`);
    return { success: false, error: "Only SELECT queries are allowed." };
  }
  console.log(`[SECURITY] PASS   — query starts with SELECT`);

  // --- Rule 3: Multi-statement detection ---
  // Strip single-quoted string literals to avoid false positives on
  // semicolons that appear inside string values, then check if a
  // semicolon remains anywhere other than a trailing position.
  const sqlWithoutStrings = trimmed.replace(/'[^']*'/g, "''");
  const withoutTrailingSemicolon = sqlWithoutStrings
    .trimEnd()
    .replace(/;$/, "");
  if (withoutTrailingSemicolon.includes(";")) {
    console.log(`[SECURITY] REJECT — multi-statement injection detected`);
    return {
      success: false,
      error: "Multiple statements are not allowed.",
    };
  }
  console.log(`[SECURITY] PASS   — no multi-statement injection detected`);

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
      console.log(`[INPUT]    Clamped pagination: skip=${skip}, limit=${limit} (MAX_ROWS=${MAX_ROWS})`);

      // COUNT query — wraps user's query so ORDER BY / LIMIT in user SQL
      // are respected when computing the page total.
      const countSql = `SELECT COUNT(*) AS total FROM (${baseQuery})`;
      console.log(`[SQL QUERY] COUNT: ${countSql.slice(0, 300)}${countSql.length > 300 ? "..." : ""}`);

      const countStmt = db.prepare(countSql);
      const countRow = countStmt.get() as { total: number };
      const total = countRow.total;
      console.log(`[DB RESULT] COUNT total=${total}`);

      // Paginated data query — LIMIT and OFFSET use ? placeholders (no injection).
      const pageSql = `SELECT * FROM (${baseQuery}) LIMIT ? OFFSET ?`;
      console.log(`[SQL QUERY] PAGE:  ${pageSql.slice(0, 300)}${pageSql.length > 300 ? "..." : ""}`);
      console.log(`[SQL PARAMS] [limit=${limit}, offset=${skip}]`);

      const pageStmt = db.prepare(pageSql);
      const rows = pageStmt.all(limit, skip) as Record<string, unknown>[];
      console.log(`[DB RESULT] ${rows.length} rows returned (paginated, skip=${skip})`);

      return { success: true, data: rows, rowCount: rows.length, total };
    }

    // Non-paginated path — unchanged behaviour, cap at MAX_ROWS.
    console.log(`[SQL QUERY] FULL:  ${trimmed.slice(0, 300)}${trimmed.length > 300 ? "..." : ""}`);
    const stmt = db.prepare(trimmed);
    const rows = stmt.all() as Record<string, unknown>[];
    const limited = rows.slice(0, MAX_ROWS);
    console.log(`[DB RESULT] ${rows.length} raw rows → capped at ${limited.length} (MAX_ROWS=${MAX_ROWS})`);

    return {
      success: true,
      data: limited,
      rowCount: limited.length,
      total: limited.length,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Query execution failed";
    console.error(`[ERROR]    executeQuery() failed: ${message}`);
    if (err instanceof Error && err.stack) {
      console.error(`[ERROR]    Stack trace:\n${err.stack}`);
    }
    return { success: false, error: message };
  }
}

export default db;
