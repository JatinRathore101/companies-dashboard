"use client";

import { useMemo } from "react";

import {
  Container,
  CssBaseline,
  ThemeProvider,
  createTheme,
} from "@mui/material";

interface LayoutWrapperProps {
  mode: "light" | "dark";
  children: React.ReactNode;
}

/**
 * Wraps the application with MUI's ThemeProvider and CssBaseline.
 * Creates the theme from the supplied `mode` and re-memoises it only
 * when `mode` changes, avoiding unnecessary re-renders.
 *
 * @param props.mode     - Current colour scheme ("light" | "dark").
 * @param props.children - Page content to render inside the themed container.
 */
export function LayoutWrapper({ mode, children }: LayoutWrapperProps) {
  const theme = useMemo(() => createTheme({ palette: { mode } }), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {children}
      </Container>
    </ThemeProvider>
  );
}
