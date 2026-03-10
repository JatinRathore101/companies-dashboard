"use client";

import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import List from "@mui/material/List";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FilterListIcon from "@mui/icons-material/FilterList";
import { useTheme } from "@mui/material/styles";
import { useAppSelector } from "@/store/hooks";
import { SIDEBAR_WIDTH, ACCORDION_SECTIONS } from "@/constants";

export function Sidebar() {
  const theme = useTheme();
  const sidebarOpen = useAppSelector((state) => state.ui?.sidebarOpen ?? true);

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
        <Box sx={{ overflow: "auto", py: 1 }}>
          {/* Sidebar heading */}
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

          {ACCORDION_SECTIONS.map((section) => (
            <Accordion
              key={section.id}
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
                  sx={{ fontWeight: 600, color: theme.palette.text.primary }}
                >
                  {section.label}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <List dense disablePadding />
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
