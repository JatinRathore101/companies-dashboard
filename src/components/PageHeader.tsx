"use client";

import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import {
  Box,
  Divider,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";

interface PageHeaderProps {
  mode: "light" | "dark";
  onToggleMode: () => void;
  rowCap: number;
}

/**
 * Displays the application title, subtitle, and a dark/light mode toggle.
 *
 * @param props.mode         - Active colour scheme, used to show the correct toggle icon.
 * @param props.onToggleMode - Callback invoked when the user clicks the toggle button.
 * @param props.rowCap       - Maximum number of rows the API will return; shown in the subtitle.
 */
export function PageHeader({ mode, onToggleMode, rowCap }: PageHeaderProps) {
  return (
    <>
      <Box
        display="flex"
        alignItems="flex-start"
        justifyContent="space-between"
        mb={3}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Company Data Explorer
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Execute read-only SELECT queries against the companies database.
            Max {rowCap} rows returned.
          </Typography>
        </Box>

        <Tooltip
          title={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
        >
          <IconButton
            onClick={onToggleMode}
            color="inherit"
            aria-label="toggle colour mode"
          >
            {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Tooltip>
      </Box>

      <Divider sx={{ mb: 3 }} />
    </>
  );
}
