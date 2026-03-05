/**
 * app/api/options/route.ts — GET /api/options
 *
 * Returns unique filter values from both tables, fetched in parallel.
 * Used to populate dropdowns / autocomplete fields on the client.
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

function distinctStrings(query: string): string[] {
  const rows = db.prepare(query).all() as Record<string, unknown>[];
  return rows.map((r) => String(Object.values(r)[0])).filter(Boolean);
}

export async function GET(): Promise<NextResponse> {
  try {
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

    return NextResponse.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch options";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
