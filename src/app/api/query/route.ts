/**
 * app/api/query/route.ts — POST /api/query
 *
 * Accepts a JSON filter object and pagination query params (skip, limit).
 * Dynamically builds a parameterized JOIN query against companies_metadata
 * and companies_techdata, applies allow/exclude filters, and returns
 * paginated results.
 *
 * Query params:
 *   skip  (optional) — row offset (default 0)
 *   limit (optional) — max rows per page (default 25, max 500)
 *
 * Body:
 *   {
 *     domainOptions:          { allow: string[], exclude: string[] },
 *     nameOptions:            { allow: string[], exclude: string[] },
 *     companyCategoryOptions: { allow: string[], exclude: string[] },
 *     countryOptions:         { allow: string[], exclude: string[] },
 *     techCategoryOptions:    { allow: string[], exclude: string[] },
 *     techOptions:            { allow: string[], exclude: string[] },
 *   }
 *
 * Logging:
 * - [API START]      — logs method + URL on every request
 * - [REQUEST QUERY]  — logs skip / limit pagination params
 * - [REQUEST BODY]   — logs the full parsed filter body
 * - [FUNCTION START] — marks entry into groupByDomain()
 * - [QUERY]          — logs each WHERE clause as it is built
 * - [SQL QUERY]      — final JOIN SQL sent to SQLite
 * - [SQL PARAMS]     — bound parameter values for the query
 * - [DB RESULT]      — raw join row count from SQLite
 * - [TRANSFORM]      — groupByDomain progress (input rows → output domains)
 * - [RESPONSE]       — summarises the paginated slice being returned
 * - [ERROR]          — full error message, stack trace, and request context
 * - [API END]        — marks successful completion
 */

import { type NextRequest, NextResponse } from "next/server";

import db from "../../../../lib/db";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FilterGroup {
  allow: string[];
  exclude: string[];
}

export interface FilterBody {
  domainOptions?: FilterGroup;
  nameOptions?: FilterGroup;
  companyCategoryOptions?: FilterGroup;
  countryOptions?: FilterGroup;
  techCategoryOptions?: FilterGroup;
  techOptions?: FilterGroup;
}

/** A single raw row returned by the JOIN SQL query. */
interface RawRow {
  domain: string;
  company_name: string | null;
  company_category: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zipcode: string | null;
  tech_name: string | null;
  tech_category: string | null;
}

/** A domain-grouped row with tech fields collected into arrays. */
export interface GroupedRow {
  [key: string]: unknown;
  domain: string;
  company_name: string | null;
  company_category: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zipcode: string | null;
  /** All technology names associated with this domain, in row order. */
  tech_name: string[];
  /** All technology categories associated with this domain, in row order. */
  tech_category: (string | null)[];
}

/**
 * Groups raw JOIN rows by domain using a Map for O(n) performance.
 *
 * All scalar company fields are taken from the first row seen for each domain
 * (they are identical across rows sharing a domain). `tech_name` and
 * `tech_category` are accumulated into arrays preserving row order.
 *
 * Logs:
 * - [FUNCTION START] groupByDomain() with input row count
 * - [TRANSFORM] when iteration finishes, shows unique domain count
 *
 * @param rows - Raw SQL rows from the companies JOIN query.
 * @returns    - One GroupedRow per unique domain.
 */
function groupByDomain(rows: RawRow[]): GroupedRow[] {
  console.log(`[FUNCTION START] groupByDomain() — ${rows.length} raw rows`);
  console.log(`[TRANSFORM] Grouping tech stacks by domain (Map-based, O(n))`);

  const map = new Map<string, GroupedRow>();

  for (const row of rows) {
    const existing = map.get(row.domain);
    if (existing) {
      if (row.tech_name !== null) existing.tech_name.push(row.tech_name);
      existing.tech_category.push(row.tech_category);
    } else {
      map.set(row.domain, {
        domain: row.domain,
        company_name: row.company_name,
        company_category: row.company_category,
        city: row.city,
        state: row.state,
        country: row.country,
        zipcode: row.zipcode,
        tech_name: row.tech_name !== null ? [row.tech_name] : [],
        tech_category: [row.tech_category],
      });
    }
  }

  const result = Array.from(map.values());
  console.log(
    `[TRANSFORM] groupByDomain complete — ${rows.length} rows → ${result.length} unique domains`,
  );
  return result;
}

// Maps each filter key to its SQL column expression in the JOIN query.
const COLUMN_MAP: Record<keyof FilterBody, string> = {
  domainOptions: "companies_metadata.domain",
  nameOptions: "companies_metadata.name",
  companyCategoryOptions: "companies_metadata.category",
  countryOptions: "companies_metadata.country",
  techCategoryOptions: "companies_techdata.category",
  techOptions: "companies_techdata.name",
};

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  console.log(`[API START] POST /api/query`);

  // --- Parse body ---
  let body: FilterBody;
  try {
    body = (await request.json()) as FilterBody;
    console.log(`[REQUEST BODY] ${JSON.stringify(body)}`);
  } catch {
    console.error(`[ERROR]    Failed to parse request body as JSON`);
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  // --- Parse pagination params ---
  const { searchParams } = new URL(request.url);
  const rawSkip = searchParams.get("skip");
  const rawLimit = searchParams.get("limit");
  console.log(
    `[REQUEST QUERY] skip=${rawSkip ?? "(default)"}, limit=${rawLimit ?? "(default)"}`,
  );

  const skip = Math.max(0, parseInt(rawSkip ?? "0", 10) || 0);
  const limit = Math.max(1, parseInt(rawLimit ?? "25", 10) || 25);
  console.log(`[INPUT]    Parsed pagination — skip=${skip}, limit=${limit}`);

  // --- Build WHERE clauses from filter groups ---
  console.log(`[FUNCTION START] buildWhereClause()`);
  const clauses: string[] = [];
  const params: string[] = [];

  for (const key of Object.keys(COLUMN_MAP) as (keyof FilterBody)[]) {
    const group = body[key];
    const col = COLUMN_MAP[key];

    if (group?.allow?.length) {
      const clause = `${col} IN (${group.allow.map(() => "?").join(", ")})`;
      clauses.push(clause);
      params.push(...group.allow);
      console.log(`[QUERY]    ALLOW  ${col} IN [${group.allow.join(", ")}]`);
    }

    if (group?.exclude?.length) {
      const clause = `${col} NOT IN (${group.exclude.map(() => "?").join(", ")})`;
      clauses.push(clause);
      params.push(...group.exclude);
      console.log(
        `[QUERY]    EXCLUDE ${col} NOT IN [${group.exclude.join(", ")}]`,
      );
    }
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  console.log(
    `[INPUT]    WHERE clause: ${where || "(none — no filters applied)"}`,
  );

  // JOIN query — companies_techdata joined to companies_metadata on domain.
  let baseQuery = ``;

  if (
    where?.includes("companies_metadata") &&
    !where?.includes("companies_techdata")
  ) {
    baseQuery = `
    SELECT
      companies_metadata.domain,
      companies_metadata.name        AS company_name,
      companies_metadata.category    AS company_category,
      companies_metadata.city,
      companies_metadata.state,
      companies_metadata.country,
      companies_metadata.zipcode
    FROM companies_metadata
    ${where}
  `;
  } else if (
    !where?.includes("companies_metadata") &&
    where?.includes("companies_techdata")
  ) {
    baseQuery = `
    SELECT
      companies_techdata.domain,
      companies_techdata.name        AS tech_name,
      companies_techdata.category    AS tech_category
    FROM companies_techdata
    ${where}
  `;
  } else {
    baseQuery = `
    SELECT
      companies_metadata.domain,
      companies_metadata.name        AS company_name,
      companies_metadata.category    AS company_category,
      companies_metadata.city,
      companies_metadata.state,
      companies_metadata.country,
      companies_metadata.zipcode,
      companies_techdata.name        AS tech_name,
      companies_techdata.category    AS tech_category
    FROM companies_metadata
    JOIN companies_techdata
      ON companies_techdata.domain = companies_metadata.domain
    ${where}
  `;
  }

  console.log(`[SQL QUERY] ${baseQuery.trim()}`);
  console.log(
    `[SQL PARAMS] [${params.map((p) => JSON.stringify(p)).join(", ")}]`,
  );

  try {
    // Fetch all matching raw rows first — pagination is applied after grouping
    // so that skip/limit operate on distinct domains, not raw join rows.
    const rows = db.prepare(baseQuery).all(...params) as RawRow[];
    console.log(`[DB RESULT] ${rows.length} raw JOIN rows returned`);

    const grouped = groupByDomain(rows);
    const total = grouped.length;
    const page = grouped.slice(skip, skip + limit);

    console.log(
      `[TRANSFORM] Pagination applied — slice(${skip}, ${skip + limit}) → ${page.length} records`,
    );
    console.log(
      `[RESPONSE] Returning ${page.length} records (total domains=${total}, skip=${skip}, limit=${limit})`,
    );
    console.log(`[API END]  POST /api/query — 200 OK`);

    return NextResponse.json({
      success: true,
      data: page,
      rowCount: page.length,
      total,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Query failed";
    console.error(`[ERROR]    POST /api/query failed: ${message}`);
    if (err instanceof Error && err.stack) {
      console.error(`[ERROR]    Stack trace:\n${err.stack}`);
    }
    console.error(
      `[ERROR]    Request context — skip=${skip}, limit=${limit}, params=[${params.join(", ")}]`,
    );
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
