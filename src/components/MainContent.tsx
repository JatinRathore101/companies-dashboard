"use client";

import { useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import { useTheme } from "@mui/material/styles";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setOptionsData, setOptionsLoading, setOptionsError } from "@/store/slices/optionsSlice";
import { StatCard } from "@/components/common/StatCard";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { MaxTechsBadge } from "@/components/common/MaxTechsBadge";
import { RawApiViewer } from "@/components/common/RawApiViewer";
import { APPBAR_HEIGHT, STAT_CARD_COLORS } from "@/constants";

export function MainContent() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { optionsData, optionsLoading, optionsError } = useAppSelector((state) => state.options);

  const handleSetOptions = async () => {
    dispatch(setOptionsLoading(true));
    try {
      const res = await fetch("/api/get-options");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      dispatch(setOptionsData(json));
    } catch (err) {
      dispatch(
        setOptionsError(
          err instanceof Error ? err.message : "Failed to fetch options",
        ),
      );
    } finally {
      dispatch(setOptionsLoading(false));
    }
  };

  useEffect(() => {
    if (optionsData || optionsLoading) return;
    handleSetOptions();
  }, []);

  const statCards = optionsData
    ? [
        {
          title: "Company Categories",
          items: optionsData.companyCategoryOptions,
          color: STAT_CARD_COLORS.companyCategories,
        },
        {
          title: "Countries",
          items: optionsData.countryOptions,
          color: STAT_CARD_COLORS.countries,
        },
        {
          title: "Technologies",
          items: optionsData.techOptions,
          color: STAT_CARD_COLORS.technologies,
        },
        {
          title: "Tech Categories",
          items: optionsData.techCategoryOptions,
          color: STAT_CARD_COLORS.techCategories,
        },
      ]
    : [];

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

      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: theme.palette.text.primary }}
        >
          Dashboard
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.secondary, mt: 0.5 }}
        >
          Overview of available filter options from the database
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {optionsError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {optionsError}
        </Alert>
      )}

      {optionsData?.maxTechsInDomain != null && (
        <Box sx={{ mb: 3 }}>
          <MaxTechsBadge value={optionsData.maxTechsInDomain} />
        </Box>
      )}

      {/* Stat cards grid */}
      <Grid container spacing={2} columns={12}>
        {optionsLoading
          ? [1, 2, 3, 4].map((i) => (
              <Grid key={i} item xs={12} sm={6} lg={3}>
                <SkeletonCard />
              </Grid>
            ))
          : statCards.map((card) => (
              <Grid key={card.title} item xs={12} sm={6} lg={3}>
                <StatCard
                  title={card.title}
                  items={card.items}
                  color={card.color}
                />
              </Grid>
            ))}
      </Grid>

      {optionsData && (
        <Box sx={{ mt: 4 }}>
          <RawApiViewer
            label="Raw API Response — /api/get-options"
            data={optionsData}
          />
        </Box>
      )}
    </Box>
  );
}
