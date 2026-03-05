"use client";

import { Alert } from "@mui/material";

interface ErrorAlertProps {
  message: string;
  onDismiss: () => void;
}

/**
 * Dismissible error banner rendered above the results table.
 *
 * @param props.message   - Human-readable error text to display.
 * @param props.onDismiss - Called when the user closes the alert.
 */
export function ErrorAlert({ message, onDismiss }: ErrorAlertProps) {
  return (
    <Alert severity="error" sx={{ mb: 2 }} onClose={onDismiss}>
      {message}
    </Alert>
  );
}
