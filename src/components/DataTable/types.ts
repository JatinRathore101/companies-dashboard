import type { ReactNode } from "react";

/**
 * Definition for a single table column.
 *
 * @template T - Shape of a data row (defaults to a generic record).
 */
export interface ColumnDef<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Column header label */
  Header: string;
  /** Key in the row object that holds this column's value */
  accessor: string;
  /** Horizontal alignment (default: "left") */
  align?: "left" | "center" | "right";
  /** Fixed column width (CSS value or number in px) */
  width?: string | number;
  /**
   * Optional custom cell renderer.
   * Receives the cell value and the full row object.
   */
  Cell?: (props: { value: unknown; row: T }) => ReactNode;
}

/** Props accepted by the DataTable component. */
export interface DataTableProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  columns: ColumnDef<T>[];
  data: T[];
  /** Shows skeleton rows while true */
  loading?: boolean;
  /** Current 0-based page index */
  page: number;
  /** Rows per page (must be one of rowsPerPageOptions) */
  rowsPerPage: number;
  /** Total row count across all pages (used by TablePagination) */
  totalRecords: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  rowsPerPageOptions?: number[];
  showPagination?: boolean;
  noDataMessage?: string;
}
