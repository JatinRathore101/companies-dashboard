"use client";

import { Box, Typography } from "@mui/material";

/**
 * Renders a compact reference listing the available database tables and their columns.
 * Intended as a footer hint so users know which identifiers are valid in their queries.
 */
export function SchemaHint() {
  return (
    <Box mt={3}>
      <Typography variant="caption" color="text.secondary">
        Available tables:{" "}
        <code>companies_metadata</code> (domain, name, category, city, state,
        country, zipcode) &nbsp;·&nbsp;{" "}
        <code>companies_techdata</code> (name, category, domain)
      </Typography>
    </Box>
  );
}
