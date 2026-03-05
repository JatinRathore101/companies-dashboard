"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { DataTable, type ColumnDef } from "@/components/DataTable";
import { ErrorAlert } from "@/components/ErrorAlert";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { PageHeader } from "@/components/PageHeader";
import { QueryInput } from "@/components/QueryInput";
import type { ApiResponse } from "@/types/api";
import type { OptionsResponse } from "@/app/api/options/route";

const DEFAULT_QUERY = "SELECT * FROM companies_metadata";
const DEFAULT_ROWS_PER_PAGE = 10;

/**
 * Derives DataTable column definitions from the keys of a result row.
 * Header labels are humanised: underscores become spaces, text uppercased.
 */
function buildColumns(row: Record<string, unknown>): ColumnDef[] {
  return Object.keys(row).map((key) => ({
    Header: key.replace(/_/g, " ").toUpperCase(),
    accessor: key,
  }));
}

/**
 * Company Data Explorer page.
 *
 * Owns all application state including pagination. On every page change the
 * same SQL is re-submitted with updated skip/limit query params so the API
 * returns only the rows needed for that page.
 */
export default function Home() {
  const [mode, setMode] = useState<"light" | "dark">("dark");

  const [sql, setSql] = useState<string>(DEFAULT_QUERY);
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [hasQueried, setHasQueried] = useState<boolean>(false);
  const [options, setOptions] = useState<OptionsResponse | null>(null);

  // Fetch unique filter values once on mount.
  useEffect(() => {
    fetch("/api/options")
      .then((res) => res.json())
      .then((data: OptionsResponse) => setOptions(data))
      .catch(() => {
        /* non-critical, silently ignore */
      });
  }, []);

  // ── Pagination state ──────────────────────────────────────────────────────
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(DEFAULT_ROWS_PER_PAGE);

  // Derive columns from the first data row whenever data changes.
  const columns = useMemo<ColumnDef[]>(
    () => (data.length > 0 ? buildColumns(data[0]) : []),
    [data],
  );

  /**
   * Fetches a single page of query results from GET /api/query.
   * Sends `skip` and `limit` so the API returns only the needed rows.
   *
   * @param queryToRun - The SQL string to execute.
   * @param skip       - Row offset for the current page.
   * @param limit      - Number of rows to fetch.
   */
  const runQuery = useCallback(
    async (queryToRun: string, skip: number, limit: number) => {
      const trimmed = queryToRun.trim();
      if (!trimmed) return;

      setLoading(true);
      setError(null);
      setHasQueried(true);

      try {
        const params = new URLSearchParams({
          q: trimmed,
          skip: String(skip),
          limit: String(limit),
        });
        const res = await fetch(`/api/query?${params.toString()}`);
        const json = (await res.json()) as ApiResponse;

        if (!json.success || !json.data) {
          setError(json.error ?? "An unknown error occurred.");
          setData([]);
          setTotal(0);
        } else {
          setData(json.data);
          setTotal(json.total ?? json.data.length);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Network error");
        setData([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Run query on mount with the default SQL and initial page.
  useEffect(() => {
    void runQuery(DEFAULT_QUERY, 0, DEFAULT_ROWS_PER_PAGE);
  }, [runQuery]);

  // ── Pagination handlers ───────────────────────────────────────────────────

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      void runQuery(sql, newPage * rowsPerPage, rowsPerPage);
    },
    [runQuery, sql, rowsPerPage],
  );

  const handleRowsPerPageChange = useCallback(
    (newRowsPerPage: number) => {
      // Reset to page 0 when page size changes.
      setPage(0);
      setRowsPerPage(newRowsPerPage);
      void runQuery(sql, 0, newRowsPerPage);
    },
    [runQuery, sql],
  );

  // ── "Run Query" button handler ────────────────────────────────────────────
  // Always resets to page 0 so results are shown from the top.
  const handleRunQuery = useCallback(() => {
    setPage(0);
    void runQuery(sql, 0, rowsPerPage);
  }, [runQuery, sql, rowsPerPage]);

  return (
    <LayoutWrapper mode={mode}>
      <PageHeader
        mode={mode}
        onToggleMode={() => setMode((m) => (m === "dark" ? "light" : "dark"))}
      />
      <QueryInput
        value={sql}
        onChange={setSql}
        onRun={handleRunQuery}
        loading={loading}
        rowCount={total}
      />
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {hasQueried && (
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          page={page}
          rowsPerPage={rowsPerPage}
          totalRecords={total}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 25, 50, 100]}
          noDataMessage={error ? "" : "Query returned no results."}
        />
      )}
    </LayoutWrapper>
  );
}
