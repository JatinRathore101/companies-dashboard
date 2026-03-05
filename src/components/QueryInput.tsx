"use client";

import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";

interface QueryInputProps {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  loading: boolean;
  rowCount: number | null;
  rowCap: number;
}

/**
 * Controlled SQL editor with a run button and result-count indicator.
 * Supports Ctrl+Enter / Cmd+Enter as a keyboard shortcut to submit.
 *
 * @param props.value    - Current SQL string (controlled).
 * @param props.onChange - Called with the updated string on every keystroke.
 * @param props.onRun    - Called when the user submits the query.
 * @param props.loading  - When true, disables the button and shows a spinner.
 * @param props.rowCount - Number of rows returned by the last query, or null.
 * @param props.rowCap   - Maximum rows the API will return; triggers a warning chip when hit.
 */
export function QueryInput({
  value,
  onChange,
  onRun,
  loading,
  rowCount,
  rowCap,
}: QueryInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") onRun();
  };

  return (
    <Box mb={3}>
      <TextField
        label="SQL Query"
        multiline
        minRows={4}
        maxRows={12}
        fullWidth
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        variant="outlined"
        spellCheck={false}
        helperText="Only SELECT statements are allowed. Press Ctrl+Enter to run."
        slotProps={{
          htmlInput: { style: { fontFamily: "monospace", fontSize: 14 } },
        }}
      />

      <Box display="flex" alignItems="center" gap={2} mt={2}>
        <Button
          variant="contained"
          size="large"
          startIcon={
            loading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <PlayArrowIcon />
            )
          }
          onClick={onRun}
          disabled={loading || !value.trim()}
        >
          {loading ? "Running…" : "Run Query"}
        </Button>

        {rowCount !== null && !loading && (
          <Chip
            label={`${rowCount.toLocaleString()} row${rowCount !== 1 ? "s" : ""} returned`}
            color={rowCount === rowCap ? "warning" : "success"}
            variant="outlined"
            size="small"
          />
        )}

        {rowCount === rowCap && !loading && (
          <Typography variant="caption" color="warning.main">
            Result capped at {rowCap} rows — add a LIMIT clause for more
            control.
          </Typography>
        )}
      </Box>
    </Box>
  );
}
