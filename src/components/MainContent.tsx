"use client";

import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import { useTheme } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store";
import { optionsSliceActions } from "@/store/slices/optionsSlice";
import { companiesTableSliceActions } from "@/store/slices/companiesTableSlice";
import type { Filters } from "@/store/slices/companiesTableSlice";
import DataTableBody from "@/components/table/dataTableBody";
import type { Column } from "@/components/table/dataTableBody";
import { APPBAR_HEIGHT, STAT_CARD_COLORS } from "@/constants";

type CompanyRow = {
  domain: string;
  companyName?: string;
  companyCategory?: string;
  city?: string;
  state?: string;
  country?: string;
  zipcode?: string;
  tech?: string[];
  techCategory?: string[];
};

const columns: Column<CompanyRow>[] = [
  { accessor: "domain", Header: "Domain", width: 200 },
  { accessor: "companyName", Header: "Company Name", width: 180 },
  { accessor: "companyCategory", Header: "Category", width: 140 },
  { accessor: "country", Header: "Country", width: 120 },
  { accessor: "city", Header: "City", width: 120 },
  {
    accessor: "tech",
    Header: "Technologies",
    Cell: ({ value }) => (
      <Typography noWrap sx={{ fontSize: "inherit", fontFamily: "Lato" }}>
        {Array.isArray(value) ? value.join(", ") : String(value ?? "")}
      </Typography>
    ),
  },
];

function buildRequestBody(
  filters: Filters,
  page: number,
  rowsPerPage: number,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    skip: page * rowsPerPage,
    limit: rowsPerPage,
  };

  if (filters.searchStr.trim()) body.searchStr = filters.searchStr.trim();
  if (filters.countries.length) body.countries = filters.countries;
  if (filters.companyCategories.length) body.companyCategories = filters.companyCategories;
  if (filters.includedTechList.length) body.includedTechList = filters.includedTechList;
  if (filters.excludedTechList.length) body.excludedTechList = filters.excludedTechList;
  if (filters.includedTechCategoryList.length)
    body.includedTechCategoryList = filters.includedTechCategoryList;
  if (filters.excludedTechCategoryList.length)
    body.excludedTechCategoryList = filters.excludedTechCategoryList;
  if (filters.minNumberOfTech > 0) body.minNumberOfTech = filters.minNumberOfTech;
  if (filters.maxNumberOfTech > 0) body.maxNumberOfTech = filters.maxNumberOfTech;

  return body;
}

export function MainContent() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { optionsData, optionsLoading, optionsError } = useSelector(
    (state: RootState) => state.options,
  );
  const filters = useSelector((state: RootState) => state.companiesTable.filters);
  const pagination = useSelector((state: RootState) => state.companiesTable.pagination);

  const [companiesData, setCompaniesData] = useState<CompanyRow[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companiesError, setCompaniesError] = useState<string | null>(null);

  const handleSetOptions = async () => {
    dispatch(optionsSliceActions.setOptionsLoading(true));
    try {
      const res = await fetch("/api/get-options");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      dispatch(optionsSliceActions.setOptionsData(json));
    } catch (err) {
      dispatch(
        optionsSliceActions.setOptionsError(
          err instanceof Error ? err.message : "Failed to fetch options",
        ),
      );
    } finally {
      dispatch(optionsSliceActions.setOptionsLoading(false));
    }
  };

  const fetchCompanies = async (
    currentFilters: Filters,
    page: number,
    rowsPerPage: number,
  ) => {
    setCompaniesLoading(true);
    setCompaniesError(null);
    try {
      const body = buildRequestBody(currentFilters, page, rowsPerPage);
      const res = await fetch("/api/get-companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setCompaniesData(json.data ?? []);
      dispatch(companiesTableSliceActions.setTotalRecords(json.totalCount ?? 0));
    } catch (err) {
      setCompaniesError(
        err instanceof Error ? err.message : "Failed to fetch companies",
      );
    } finally {
      setCompaniesLoading(false);
    }
  };

  useEffect(() => {
    if (optionsData || optionsLoading) return;
    handleSetOptions();
  }, []);

  useEffect(() => {
    fetchCompanies(filters, pagination.page, pagination.rowsPerPage);
  }, [filters, pagination.page, pagination.rowsPerPage]);

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        p: 3,
        transition: theme.transitions.create("margin", {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        minHeight: "100vh",
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Box sx={{ height: APPBAR_HEIGHT }} />

      {optionsError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {optionsError}
        </Alert>
      )}

      {/* Companies table */}
      <Box sx={{ mt: 4 }}>
        {companiesError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {companiesError}
          </Alert>
        )}
        <DataTableBody<CompanyRow>
          columns={columns}
          data={companiesData}
          page={pagination.page}
          rowsPerPage={pagination.rowsPerPage}
          totalRecords={pagination.totalRecords}
          loading={companiesLoading}
          handlePageChange={(value) =>
            dispatch(companiesTableSliceActions.setPage(value))
          }
          handleRowsPerPageChange={(value) => {
            dispatch(companiesTableSliceActions.setPage(0));
            dispatch(companiesTableSliceActions.setRowsPerPage(value));
          }}
          noDataHeading="No companies found"
          noDataSubHeading="Try adjusting your filters"
        />
      </Box>
    </Box>
  );
}
