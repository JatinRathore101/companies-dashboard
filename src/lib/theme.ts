import { createTheme } from "@mui/material/styles";
import type { PaletteMode } from "@mui/material";

export function createAppTheme(mode: PaletteMode) {
  return createTheme({
    palette: {
      mode,
      ...(mode === "dark"
        ? {
            primary: { main: "#90caf9" },
            secondary: { main: "#ce93d8" },
            background: { default: "#0a0a0f", paper: "#13131a" },
          }
        : {
            primary: { main: "#1976d2" },
            secondary: { main: "#9c27b0" },
            background: { default: "#f4f6f8", paper: "#ffffff" },
          }),
    },
    shape: { borderRadius: 8 },
    typography: {
      fontFamily: "inherit",
      h6: { fontWeight: 600 },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: { backgroundImage: "none" },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: { backgroundImage: "none" },
        },
      },
    },
  });
}
