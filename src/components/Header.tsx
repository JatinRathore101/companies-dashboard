"use client";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { useTheme } from "@mui/material/styles";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSidebarOpen } from "@/store/slices/uiSlice";
import { toggleThemeMode } from "@/store/slices/themeSlice";

export function Header() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const themeMode = useAppSelector((state) => state.theme?.themeMode ?? "dark");
  const sidebarOpen = useAppSelector((state) => state.ui?.sidebarOpen ?? true);

  function handleThemeToggle() {
    dispatch(toggleThemeMode());
  }

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        width: "100%",
      }}
    >
      <Toolbar sx={{ gap: 1 }}>
        <IconButton
          edge="start"
          aria-label="toggle sidebar"
          onClick={() => dispatch(setSidebarOpen(!sidebarOpen))}
          sx={{ color: theme.palette.text.primary }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          sx={{ fontSize: { xs: "17px", md: "20px" }, fontWeight: 700 }}
        >
          Fiber AI
        </Typography>
        <Typography
          sx={{
            flexGrow: 1,
            fontSize: { xs: "21px", md: "24px" },
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          Company Intelligence Dashboard
        </Typography>

        <IconButton
          onClick={handleThemeToggle}
          aria-label="toggle theme"
          sx={{ color: theme.palette.text.primary }}
        >
          {themeMode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
