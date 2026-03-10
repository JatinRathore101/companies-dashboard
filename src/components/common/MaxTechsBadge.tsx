"use client";

import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

interface MaxTechsBadgeProps {
  value: number;
}

export function MaxTechsBadge({ value }: MaxTechsBadgeProps) {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        display: "inline-flex",
        alignItems: "center",
        px: 3,
        py: 1.5,
        gap: 2,
      }}
    >
      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
        Max technologies per domain
      </Typography>
      <Typography
        variant="h5"
        sx={{ fontWeight: 700, color: theme.palette.primary.main }}
      >
        {value}
      </Typography>
    </Card>
  );
}
