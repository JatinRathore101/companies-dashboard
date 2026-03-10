"use client";

import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import { useTheme } from "@mui/material/styles";

export function SkeletonCard() {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{ border: `1px solid ${theme.palette.divider}`, p: 2 }}
    >
      <Skeleton variant="text" width="40%" />
      <Skeleton variant="text" width="20%" height={48} />
      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rounded" width={60} height={24} />
        ))}
      </Box>
    </Card>
  );
}
