"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Button from "@mui/material/Button";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FilterListIcon from "@mui/icons-material/FilterList";
import { useTheme } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store";
import { companiesTableSliceActions } from "@/store/slices/companiesTableSlice";
import { SIDEBAR_WIDTH, ACCORDION_SECTIONS } from "@/constants";
import MultiSelect from "./autocomplete/multiselect";
import RangeSlider from "./slider/rangeSlider";
import CustomChip from "./chips/customChip";

interface DraftFilters {
  searchStr: string;
  countries: string[];
  companyCategories: string[];
  includedTechList: string[];
  excludedTechList: string[];
  minNumberOfTech: number;
  maxNumberOfTech: number;
  includedTechCategoryList: string[];
  excludedTechCategoryList: string[];
}

export function Sidebar() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const sidebarOpen = useSelector(
    (state: RootState) => state.ui?.sidebarOpen ?? true,
  );
  const filters = useSelector(
    (state: RootState) => state.companiesTable.filters,
  );
  const optionsData = useSelector(
    (state: RootState) => state.options.optionsData,
  );

  const [draft, setDraft] = useState<DraftFilters>(filters);

  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  const handleApply = () => {
    console.log(JSON.stringify(draft, null, 2));
    dispatch(
      companiesTableSliceActions.setFilters({
        ...draft,
        minNumberOfTech: draft.minNumberOfTech ?? 0,
        maxNumberOfTech:
          draft.maxNumberOfTech ?? optionsData?.maxTechsInDomain ?? 0,
      }),
    );
  };

  const renderContent = (id: string) => {
    switch (id) {
      case "countries":
        return (
          <MultiSelect
            value={draft.countries}
            options={optionsData?.countryOptions ?? []}
            placeholder="Select countries (e.g., UK, FR etc)"
            onChange={(value) =>
              setDraft((prev) => ({ ...prev, countries: value }))
            }
          />
        );

      case "companyCategories":
        return (
          <MultiSelect
            value={draft.companyCategories}
            options={optionsData?.companyCategoryOptions ?? []}
            placeholder="Select categories (e.g., Technology And Computing)"
            onChange={(value) =>
              setDraft((prev) => ({ ...prev, companyCategories: value }))
            }
          />
        );

      case "techList":
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography sx={{ color: theme.palette.text.secondary }}>
              Any of
            </Typography>
            <MultiSelect
              value={draft.includedTechList}
              options={optionsData?.techOptions ?? []}
              placeholder="Select technologies (e.g., JQuery)"
              onChange={(value) =>
                setDraft((prev) => ({ ...prev, includedTechList: value }))
              }
            />
            <Typography sx={{ color: theme.palette.text.secondary, mt: 1 }}>
              None of
            </Typography>
            <MultiSelect
              value={draft.excludedTechList}
              options={optionsData?.techOptions ?? []}
              placeholder="Select technologies to exclude..."
              onChange={(value) =>
                setDraft((prev) => ({ ...prev, excludedTechList: value }))
              }
            />
          </Box>
        );

      case "numberOfTech":
        return (
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <CustomChip
                chipValue={draft?.minNumberOfTech ?? 0}
                chipState="PURPLE"
              />
              <CustomChip
                chipValue={
                  draft?.maxNumberOfTech ?? optionsData?.maxTechsInDomain ?? 0
                }
                chipState="PURPLE"
              />
            </Box>
            <RangeSlider
              value={[
                draft?.minNumberOfTech ?? 0,
                draft?.maxNumberOfTech ?? optionsData?.maxTechsInDomain ?? 0,
              ]}
              setValue={(v) =>
                setDraft((prev) => ({
                  ...prev,
                  minNumberOfTech: v?.[0] ?? 0,
                  maxNumberOfTech: v?.[1] ?? optionsData?.maxTechsInDomain ?? 0,
                }))
              }
              minVal={0}
              maxVal={optionsData?.maxTechsInDomain}
            />
          </Box>
        );

      case "techCategoryList":
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography sx={{ color: theme.palette.text.secondary }}>
              Any of
            </Typography>
            <MultiSelect
              value={draft.includedTechCategoryList}
              options={optionsData?.techCategoryOptions ?? []}
              onChange={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  includedTechCategoryList: value,
                }))
              }
              placeholder="Select technology categories (e.g., Advertizing)"
            />
            <Typography sx={{ color: theme.palette.text.secondary, mt: 1 }}>
              None of
            </Typography>
            <MultiSelect
              value={draft.excludedTechCategoryList}
              options={optionsData?.techCategoryOptions ?? []}
              onChange={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  excludedTechCategoryList: value,
                }))
              }
              placeholder="Select technology categories to exclude..."
            />
          </Box>
        );

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

        <Box
          sx={{
            overflow: "auto",
            py: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
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
                  <ExpandMoreIcon
                    fontSize="small"
                    sx={{ color: theme.palette.text.secondary }}
                  />
                }
                sx={{
                  px: 2,
                  minHeight: 40,
                  "& .MuiAccordionSummary-content": { my: 0 },
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: { xs: "15px", md: "17px" },
                  }}
                >
                  {label}
                </Typography>
              </AccordionSummary>

              <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
                {renderContent(id)}
              </AccordionDetails>
            </Accordion>
          ))}

          <Box
            sx={{
              px: 2,
              pt: 2,
              pb: 1,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Button
              sx={{ width: "100px" }}
              variant="contained"
              fullWidth
              onClick={handleApply}
            >
              Apply
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
