"use client";

import {
  Box,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  useTheme,
} from "@mui/material";

import type { DataTableProps } from "./types";

/**
 * Reusable MUI-based data table with skeleton loading, server-driven
 * pagination, and flexible custom cell renderers.
 *
 * Pagination is fully controlled: the parent owns `page` / `rowsPerPage`
 * state and calls the API with the updated `skip` / `limit` values.
 */
export function DataTable<
  T extends Record<string, unknown> = Record<string, unknown>,
>({
  columns,
  data,
  loading = false,
  page,
  rowsPerPage,
  totalRecords,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [10, 25, 50],
  showPagination = true,
  noDataMessage = "No results found.",
}: DataTableProps<T>) {
  const theme = useTheme();
  const isEmpty = !loading && data.length === 0;

  // ─── Header row ────────────────────────────────────────────────────────────
  const headerCells = columns.map((col) => (
    <TableCell
      key={col.accessor}
      align={col.align ?? "left"}
      sx={{
        width: col.width ?? "auto",
        whiteSpace: "nowrap",
        fontWeight: 700,
        fontSize: "0.8125rem",
        color: theme.palette.text.secondary,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      {col.Header}
    </TableCell>
  ));

  // ─── Skeleton rows (shown while loading) ───────────────────────────────────
  const skeletonRows = Array.from({ length: rowsPerPage }, (_, rowIdx) => (
    <TableRow key={`skeleton-${rowIdx}`} sx={{ height: 48 }}>
      {columns.map((col) => (
        <TableCell
          key={col.accessor}
          align={col.align ?? "left"}
          sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
        >
          <Skeleton animation="wave" height={20} />
        </TableCell>
      ))}
    </TableRow>
  ));

  // ─── Data rows ─────────────────────────────────────────────────────────────
  const dataRows = data.map((row, rowIdx) => (
    <TableRow
      key={rowIdx}
      hover
      sx={{ height: 48, "&:last-child td": { borderBottom: 0 } }}
    >
      {columns.map((col) => {
        const value = row[col.accessor];
        return (
          <TableCell
            key={col.accessor}
            align={col.align ?? "left"}
            sx={{
              fontSize: "0.8125rem",
              color: theme.palette.text.primary,
              borderBottom: `1px solid ${theme.palette.divider}`,
              width: col.width ?? "auto",
            }}
          >
            {col.Cell ? (
              col.Cell({ value, row })
            ) : (
              <Typography
                component="span"
                noWrap
                sx={{ fontSize: "inherit", display: "block" }}
              >
                {value === null || value === undefined ? "—" : String(value)}
              </Typography>
            )}
          </TableCell>
        );
      })}
    </TableRow>
  ));

  // ─── Empty state ───────────────────────────────────────────────────────────
  const emptyRow = (
    <TableRow sx={{ height: 200 }}>
      <TableCell colSpan={columns.length} align="center">
        <Typography color="text.disabled">{noDataMessage}</Typography>
      </TableCell>
    </TableRow>
  );

  return (
    <Box
      sx={{
        width: "100%",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        overflow: "hidden",
      }}
    >
      <TableContainer sx={{ borderRadius: "4px 4px 0 0", overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 600 }}>
          {/* ── Head ── */}
          <TableHead
            sx={{
              bgcolor:
                theme.palette.mode === "light"
                  ? theme.palette.grey[100]
                  : theme.palette.grey[900],
            }}
          >
            <TableRow>{headerCells}</TableRow>
          </TableHead>

          {/* ── Body ── */}
          <TableBody>
            {loading ? skeletonRows : isEmpty ? emptyRow : dataRows}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Pagination ── */}
      {showPagination && (
        <TablePagination
          component="div"
          count={totalRecords}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={rowsPerPageOptions}
          onPageChange={(_, newPage) => onPageChange(newPage)}
          onRowsPerPageChange={(e) =>
            onRowsPerPageChange(Number(e.target.value))
          }
          sx={{
            borderTop: `1px solid ${theme.palette.divider}`,
            fontSize: "0.75rem",
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
              { fontSize: "0.75rem" },
          }}
        />
      )}
    </Box>
  );
}
