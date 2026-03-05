"use client";

import { useMemo } from "react";

import { Alert, Box, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";

interface ResultsTableProps {
  data: Record<string, unknown>[];
  loading: boolean;
  hasQueried: boolean;
  error: string | null;
}

/**
 * Derives DataGrid column definitions from the keys of a single result row.
 * Column headers are humanised: underscores become spaces and text is uppercased.
 *
 * @param row - Any row from the query result set.
 * @returns   Array of GridColDef objects ready for DataGrid.
 */
function buildColumns(row: Record<string, unknown>): GridColDef[] {
  return Object.keys(row).map((key) => ({
    field: key,
    headerName: key.replace(/_/g, " ").toUpperCase(),
    flex: 1,
    minWidth: 130,
    sortable: true,
  }));
}

/**
 * Displays query results in a paginated, sortable MUI DataGrid.
 * Handles three distinct states: pre-query placeholder, empty result, and data.
 *
 * @param props.data       - Rows returned by the last successful query.
 * @param props.loading    - When true, the DataGrid shows its built-in overlay spinner.
 * @param props.hasQueried - Whether the user has run at least one query this session.
 * @param props.error      - Current error string, used to suppress the empty-result alert.
 */
export function ResultsTable({
  data,
  loading,
  hasQueried,
  error,
}: ResultsTableProps) {
  const columns = useMemo(
    () => (data.length > 0 ? buildColumns(data[0]) : []),
    [data],
  );

  // Prefix each row with a synthetic index so DataGrid never conflicts
  // with an actual column called "id" that may exist in the query result.
  const rows = useMemo(
    () => data.map((row, idx) => ({ ...row, __rowIndex: idx })),
    [data],
  );

  if (!hasQueried) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height={200}
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          borderStyle: "dashed",
        }}
      >
        <Typography color="text.disabled">
          Enter a SQL query above and click <strong>Run Query</strong>.
        </Typography>
      </Box>
    );
  }

  if (!loading && data.length === 0 && !error) {
    return <Alert severity="info">Query returned no results.</Alert>;
  }

  return (
    <Box
      sx={{
        height: 560,
        width: "100%",
        "& .MuiDataGrid-root": { borderRadius: 1 },
      }}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        getRowId={(row) =>
          (row as Record<string, unknown>).__rowIndex as number
        }
        pageSizeOptions={[25, 50, 100]}
        initialState={{
          pagination: { paginationModel: { pageSize: 25 } },
        }}
        disableRowSelectionOnClick
        density="compact"
        sx={{
          border: 1,
          borderColor: "divider",
          "& .MuiDataGrid-cell": { whiteSpace: "normal" },
        }}
      />
    </Box>
  );
}
