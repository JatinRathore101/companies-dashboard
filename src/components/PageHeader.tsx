"use client";

import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { Box, Divider, IconButton, Tooltip, Typography } from "@mui/material";

interface PageHeaderProps {
  mode: "light" | "dark";
  onToggleMode: () => void;
}

/**
 * Displays the application title, subtitle, and a dark/light mode toggle.
 *
 * @param props.mode         - Active colour scheme, used to show the correct toggle icon.
 * @param props.onToggleMode - Callback invoked when the user clicks the toggle button.
 */
export function PageHeader({ mode, onToggleMode }: PageHeaderProps) {
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
        </Box>

        <Tooltip title={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}>
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
