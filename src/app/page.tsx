"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";

import { Box, Button, CircularProgress } from "@mui/material";

import { DataTable, type ColumnDef } from "@/components/DataTable";
import { ErrorAlert } from "@/components/ErrorAlert";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { MultiSelectAutocomplete } from "@/components/MultiSelectAutocomplete";
import { PageHeader } from "@/components/PageHeader";
import type { OptionsResponse } from "@/app/api/options/route";
import type { FilterBody } from "@/app/api/query/route";
import type { ApiResponse } from "@/types/api";

const DEFAULT_ROWS_PER_PAGE = 10;

function buildColumns(row: Record<string, unknown>): ColumnDef[] {
  return Object.keys(row).map((key) => ({
    Header: key.replace(/_/g, " ").toUpperCase(),
    accessor: key,
  }));
}

// ---------------------------------------------------------------------------
// Filter state types
// ---------------------------------------------------------------------------

type FilterKey = keyof Required<FilterBody>;

interface FilterGroup {
  allow: string[];
  exclude: string[];
}

type Filters = Record<FilterKey, FilterGroup>;

const FILTER_KEYS: FilterKey[] = [
  "domainOptions",
  "nameOptions",
  "companyCategoryOptions",
  "countryOptions",
  "techCategoryOptions",
  "techOptions",
];

const FILTER_LABELS: Record<FilterKey, string> = {
  domainOptions: "Domain",
  nameOptions: "Company Name",
  companyCategoryOptions: "Company Category",
  countryOptions: "Country",
  techCategoryOptions: "Tech Category",
  techOptions: "Technology",
};

function emptyFilters(): Filters {
  return {
    domainOptions: { allow: [], exclude: [] },
    nameOptions: { allow: [], exclude: [] },
    companyCategoryOptions: { allow: [], exclude: [] },
    countryOptions: { allow: [], exclude: [] },
    techCategoryOptions: { allow: [], exclude: [] },
    techOptions: { allow: [], exclude: [] },
  };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function Home() {
  const [mode, setMode] = useState<"light" | "dark">("dark");

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasQueried, setHasQueried] = useState(false);

  const [options, setOptions] = useState<OptionsResponse | null>(null);
  const [filters, setFilters] = useState<Filters>(emptyFilters);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  // Fetch dropdown options once on mount.
  useEffect(() => {
    fetch("/api/options")
      .then((res) => res.json())
      .then((d: OptionsResponse) => setOptions(d))
      .catch(() => {});
  }, []);

  const columns = useMemo<ColumnDef[]>(
    () => (data.length > 0 ? buildColumns(data[0]) : []),
    [data],
  );

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchData = useCallback(
    async (skip: number, limit: number) => {
      setLoading(true);
      setError(null);
      setHasQueried(true);

      try {
        const res = await fetch(`/api/query?skip=${skip}&limit=${limit}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(filters),
        });
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
    [filters],
  );

  const handleFetchData = useCallback(() => {
    setPage(0);
    void fetchData(0, rowsPerPage);
  }, [fetchData, rowsPerPage]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      void fetchData(newPage * rowsPerPage, rowsPerPage);
    },
    [fetchData, rowsPerPage],
  );

  const handleRowsPerPageChange = useCallback(
    (newRowsPerPage: number) => {
      setPage(0);
      setRowsPerPage(newRowsPerPage);
      void fetchData(0, newRowsPerPage);
    },
    [fetchData],
  );

  // ── Stable per-slot filter updaters ───────────────────────────────────────
  // One callback per (filterKey, slot) pair — stable references so the memoised
  // MultiSelectAutocomplete instances don't re-render on unrelated state changes.

  const makeFilterUpdater = useCallback(
    (key: FilterKey, slot: "allow" | "exclude") => (value: string[]) => {
      setFilters((prev) => ({
        ...prev,
        [key]: { ...prev[key], [slot]: value },
      }));
    },
    [],
  );

  // Pre-build all 12 stable callbacks at mount time (keys & slots are constant).
  const filterUpdaters = useMemo(
    () =>
      Object.fromEntries(
        FILTER_KEYS.flatMap((key) => [
          [`${key}_allow`, makeFilterUpdater(key, "allow")],
          [`${key}_exclude`, makeFilterUpdater(key, "exclude")],
        ]),
      ) as Record<string, (value: string[]) => void>,
    [makeFilterUpdater],
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <LayoutWrapper mode={mode}>
      <PageHeader
        mode={mode}
        onToggleMode={() => setMode((m) => (m === "dark" ? "light" : "dark"))}
      />

      {/* 12 multiselect autocompletes — Allow + Exclude for each filter key */}
      <Box display="flex" flexWrap="wrap" gap={2} mb={3}>
        {FILTER_KEYS.map((key) => {
          const opts = options?.[key] ?? [];
          const label = FILTER_LABELS[key];

          return (
            <Fragment key={key}>
              <Box sx={{ minWidth: 220, flex: "1 1 220px" }}>
                <MultiSelectAutocomplete
                  label={`${label} — Allow`}
                  options={opts}
                  value={filters[key].allow}
                  onChange={filterUpdaters[`${key}_allow`]}
                />
              </Box>
              <Box sx={{ minWidth: 220, flex: "1 1 220px" }}>
                <MultiSelectAutocomplete
                  label={`${label} — Exclude`}
                  options={opts}
                  value={filters[key].exclude}
                  onChange={filterUpdaters[`${key}_exclude`]}
                />
              </Box>
            </Fragment>
          );
        })}
      </Box>

      {/* Fetch Data button */}
      <Box mb={3}>
        <Button
          variant="contained"
          size="large"
          onClick={handleFetchData}
          disabled={loading}
          startIcon={
            loading ? <CircularProgress size={18} color="inherit" /> : undefined
          }
        >
          {loading ? "Fetching…" : "Fetch Data"}
        </Button>
      </Box>

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
          noDataMessage={error ? "" : "No results found."}
        />
      )}
    </LayoutWrapper>
  );
}
