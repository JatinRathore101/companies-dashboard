"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

interface RawApiViewerProps {
  label: string;
  data: unknown;
}

export function RawApiViewer({ label, data }: RawApiViewerProps) {
  const theme = useTheme();

  return (
    <Box>
      <Typography
        variant="overline"
        sx={{
          color: theme.palette.text.secondary,
          letterSpacing: 1.2,
          display: "block",
          mb: 1,
        }}
      >
        {label}
      </Typography>
      <Card
        elevation={0}
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <CardContent>
          <Box
            component="pre"
            sx={{
              m: 0,
              fontSize: "0.75rem",
              color: theme.palette.text.primary,
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              maxHeight: 400,
              overflowY: "auto",
            }}
          >
            {JSON.stringify(data, null, 2)}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
