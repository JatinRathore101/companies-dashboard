/**
 * app/api/options/route.ts — GET /api/options
 *
 * Returns unique filter values from both tables, fetched in parallel.
 * Used to populate dropdowns / autocomplete fields on the client.
 *
 * Logging:
 * - [API START]      — logs method + route on every request
 * - [FUNCTION START] — marks entry into distinctStrings()
 * - [SQL QUERY]      — logs the DISTINCT query being run
 * - [DB RESULT]      — logs how many unique values were returned per field
 * - [RESPONSE]       — summarises counts for all option arrays
 * - [ERROR]          — full error message and stack trace
 * - [API END]        — marks successful completion
 */

import { NextResponse } from "next/server";

import db from "../../../../lib/db";

export const dynamic = "force-dynamic";

export interface OptionsResponse {
  domainOptions: string[];
  nameOptions: string[];
  companyCategoryOptions: string[];
  countryOptions: string[];
  techCategoryOptions: string[];
  techOptions: string[];
}

/**
 * Runs a DISTINCT SELECT query and returns the first column of each row
 * as a filtered array of non-empty strings.
 *
 * Logs the SQL query and resulting count for debugging.
 */
function distinctStrings(query: string): string[] {
  console.log(`[FUNCTION START] distinctStrings()`);
  console.log(`[SQL QUERY] ${query}`);
  const rows = db.prepare(query).all() as Record<string, unknown>[];
  const result = rows.map((r) => String(Object.values(r)[0])).filter(Boolean);
  console.log(`[DB RESULT] ${result.length} distinct values returned`);
  return result;
}

export async function GET(): Promise<NextResponse> {
  console.log(`[API START] GET /api/options`);

  try {
    console.log(`[INPUT]    Fetching all 6 distinct-value queries in parallel`);

    const [
      domainOptions,
      nameOptions,
      companyCategoryOptions,
      countryOptions,
      techCategoryOptions,
      techOptions,
    ] = await Promise.all([
      Promise.resolve(distinctStrings("SELECT DISTINCT domain FROM companies_metadata ORDER BY domain")),
      Promise.resolve(distinctStrings("SELECT DISTINCT name FROM companies_metadata ORDER BY name")),
      Promise.resolve(distinctStrings("SELECT DISTINCT category FROM companies_metadata ORDER BY category")),
      Promise.resolve(distinctStrings("SELECT DISTINCT country FROM companies_metadata ORDER BY country")),
      Promise.resolve(distinctStrings("SELECT DISTINCT category FROM companies_techdata ORDER BY category")),
      Promise.resolve(distinctStrings("SELECT DISTINCT name FROM companies_techdata ORDER BY name")),
    ]);

    const body: OptionsResponse = {
      domainOptions,
      nameOptions,
      companyCategoryOptions,
      countryOptions,
      techCategoryOptions,
      techOptions,
    };

    console.log(
      `[RESPONSE] domainOptions=${domainOptions.length}, nameOptions=${nameOptions.length}, ` +
      `companyCategoryOptions=${companyCategoryOptions.length}, countryOptions=${countryOptions.length}, ` +
      `techCategoryOptions=${techCategoryOptions.length}, techOptions=${techOptions.length}`,
    );
    console.log(`[API END]  GET /api/options — 200 OK`);

    return NextResponse.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch options";
    console.error(`[ERROR]    GET /api/options failed: ${message}`);
    if (err instanceof Error && err.stack) {
      console.error(`[ERROR]    Stack trace:\n${err.stack}`);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
