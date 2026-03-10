"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FilterListIcon from "@mui/icons-material/FilterList";
import { useTheme } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store";
import { companiesTableSliceActions, type Filters } from "@/store/slices/companiesTableSlice";
import { SIDEBAR_WIDTH, ACCORDION_SECTIONS } from "@/constants";

interface DraftFilters {
  searchStr: string;
  countries: string[];
  companyCategories: string[];
  includedTechList: string[];
  excludedTechList: string[];
  minNumberOfTech: string;
  maxNumberOfTech: string;
  includedTechCategoryList: string[];
  excludedTechCategoryList: string[];
}

function toDraft(filters: Filters): DraftFilters {
  return {
    ...filters,
    minNumberOfTech: filters.minNumberOfTech > 0 ? String(filters.minNumberOfTech) : "",
    maxNumberOfTech: filters.maxNumberOfTech > 0 ? String(filters.maxNumberOfTech) : "",
  };
}

export function Sidebar() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const sidebarOpen = useSelector((state: RootState) => state.ui?.sidebarOpen ?? true);
  const filters = useSelector((state: RootState) => state.companiesTable.filters);
  const optionsData = useSelector((state: RootState) => state.options.optionsData);

  const [draft, setDraft] = useState<DraftFilters>(() => toDraft(filters));

  const handleApply = () => {
    dispatch(
      companiesTableSliceActions.setFilters({
        ...draft,
        minNumberOfTech: Number(draft.minNumberOfTech) || 0,
        maxNumberOfTech: Number(draft.maxNumberOfTech) || 0,
      }),
    );
  };

  const multiSelect = (
    key: keyof Pick<
      DraftFilters,
      | "countries"
      | "companyCategories"
      | "includedTechList"
      | "excludedTechList"
      | "includedTechCategoryList"
      | "excludedTechCategoryList"
    >,
    options: string[],
  ) => (
    <Autocomplete
      multiple
      size="small"
      options={options}
      value={draft[key]}
      onChange={(_, newValue) => setDraft((prev) => ({ ...prev, [key]: newValue }))}
      renderInput={(params) => (
        <TextField {...params} placeholder={options.length ? "Select..." : "Loading..."} />
      )}
      sx={{ width: "100%" }}
    />
  );

  const renderContent = (id: string) => {
    switch (id) {
      case "searchStr":
        return (
          <TextField
            size="small"
            fullWidth
            placeholder="Search companies..."
            value={draft.searchStr}
            onChange={(e) => setDraft((prev) => ({ ...prev, searchStr: e.target.value }))}
          />
        );
      case "countries":
        return multiSelect("countries", optionsData?.countryOptions ?? []);
      case "companyCategories":
        return multiSelect("companyCategories", optionsData?.companyCategoryOptions ?? []);
      case "includedTechList":
        return multiSelect("includedTechList", optionsData?.techOptions ?? []);
      case "excludedTechList":
        return multiSelect("excludedTechList", optionsData?.techOptions ?? []);
      case "minNumberOfTech":
        return (
          <TextField
            size="small"
            fullWidth
            type="number"
            placeholder="0"
            value={draft.minNumberOfTech}
            onChange={(e) => setDraft((prev) => ({ ...prev, minNumberOfTech: e.target.value }))}
            inputProps={{ min: 0 }}
          />
        );
      case "maxNumberOfTech":
        return (
          <TextField
            size="small"
            fullWidth
            type="number"
            placeholder="0"
            value={draft.maxNumberOfTech}
            onChange={(e) => setDraft((prev) => ({ ...prev, maxNumberOfTech: e.target.value }))}
            inputProps={{ min: 0 }}
          />
        );
      case "includedTechCategoryList":
        return multiSelect("includedTechCategoryList", optionsData?.techCategoryOptions ?? []);
      case "excludedTechCategoryList":
        return multiSelect("excludedTechCategoryList", optionsData?.techCategoryOptions ?? []);
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        width: sidebarOpen ? SIDEBAR_WIDTH : 0,
        flexShrink: 0,
        overflow: "hidden",
        transition: "width 300ms ease",
        borderRight: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Box sx={{ width: SIDEBAR_WIDTH }}>
        <Toolbar />
        <Box sx={{ overflow: "auto", py: 1, display: "flex", flexDirection: "column" }}>
          <Box
            sx={{
              color: theme.palette.primary.main,
              display: "flex",
              alignItems: "center",
              gap: 1,
              pl: 2,
            }}
          >
            <FilterListIcon />
            <Typography
              variant="overline"
              sx={{
                px: 2,
                py: 1,
                display: "block",
                color: theme.palette.text.secondary,
                letterSpacing: 1.2,
                fontWeight: 600,
                fontSize: { xs: "14px", md: "16px" },
              }}
            >
              Filters
            </Typography>
          </Box>

          <Divider sx={{ mb: 1 }} />

          {ACCORDION_SECTIONS.map(({ id, label }) => (
            <Accordion
              key={id}
              disableGutters
              elevation={0}
              sx={{
                backgroundColor: "transparent",
                "&:before": { display: "none" },
                "&.Mui-expanded": { margin: 0 },
              }}
            >
              <AccordionSummary
                expandIcon={
                  <ExpandMoreIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                }
                sx={{
                  px: 2,
                  minHeight: 40,
                  "& .MuiAccordionSummary-content": { my: 0 },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                  {label}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
                {renderContent(id)}
              </AccordionDetails>
            </Accordion>
          ))}

          <Box sx={{ px: 2, pt: 2, pb: 1 }}>
            <Button variant="contained" fullWidth onClick={handleApply}>
              Apply
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
