"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import { useTheme } from "@mui/material/styles";

interface StatCardProps {
  title: string;
  items: string[];
  color: string;
}

export function StatCard({ title, items, color }: StatCardProps) {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <CardContent>
        <Typography
          variant="overline"
          sx={{
            color: theme.palette.text.secondary,
            letterSpacing: 1,
            display: "block",
            mb: 1,
          }}
        >
          {title}
        </Typography>

        <Typography variant="h4" sx={{ fontWeight: 700, color, mb: 1.5 }}>
          {items.length}
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {items.slice(0, 6).map((item) => (
            <Chip
              key={item}
              label={item}
              size="small"
              sx={{
                fontSize: "0.7rem",
                backgroundColor: `${color}22`,
                color,
                border: `1px solid ${color}44`,
              }}
            />
          ))}
          {items.length > 6 && (
            <Chip
              label={`+${items.length - 6} more`}
              size="small"
              sx={{ fontSize: "0.7rem" }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
