/**
 * app/api/query/route.ts — GET /api/query
 *
 * Query params:
 *   q     (required) — the SQL SELECT query
 *   skip  (optional) — number of rows to skip (default 0)
 *   limit (optional) — max rows to return per page (default 25, max 500)
 *
 * Architecture decisions:
 * - All SQL validation lives in lib/db.ts (executeQuery) so this handler
 *   only deals with HTTP concerns: parsing URL params, mapping the
 *   result to the correct HTTP status code, and returning JSON.
 * - force-dynamic ensures Next.js never caches DB responses.
 * - No raw SQL is ever constructed in this file — the user's `q` param is
 *   passed opaquely to executeQuery which handles all security checks.
 * - skip/limit are parsed as integers here; executeQuery clamps them to
 *   safe bounds before any interpolation.
 */

import { type NextRequest, NextResponse } from "next/server";

import { executeQuery } from "../../../../lib/db";
import type { ApiResponse } from "@/types/api";

// Never serve a cached response — every request hits the DB.
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const skipParam = searchParams.get("skip");
  const limitParam = searchParams.get("limit");

  // --- Validate presence of query parameter ---
  if (!q || !q.trim()) {
    return NextResponse.json(
      { success: false, error: 'Missing required query parameter: "q"' },
      { status: 400 },
    );
  }

  // --- Parse pagination params — fall back to non-paginated if absent ---
  const hasPagination = skipParam !== null || limitParam !== null;
  const pagination = hasPagination
    ? {
        skip: Number.isFinite(Number(skipParam)) ? Math.max(0, Number(skipParam)) : 0,
        limit: Number.isFinite(Number(limitParam)) ? Math.max(1, Number(limitParam)) : 25,
      }
    : undefined;

  // --- Delegate to the secure query executor in lib/db.ts ---
  const result = executeQuery(q, pagination);

  if (!result.success) {
    // Validation or execution error — 400 Bad Request
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true,
    data: result.data,
    rowCount: result.rowCount,
    total: result.total,
  });
}
