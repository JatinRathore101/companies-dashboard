"use client";

import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { Box, Button, CircularProgress, TextField } from "@mui/material";

interface QueryInputProps {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  loading: boolean;
}

/**
 * Controlled SQL editor with a run button and result-count indicator.
 * Supports Ctrl+Enter / Cmd+Enter as a keyboard shortcut to submit.
 *
 * @param props.value    - Current SQL string (controlled).
 * @param props.onChange - Called with the updated string on every keystroke.
 * @param props.onRun    - Called when the user submits the query.
 * @param props.loading  - When true, disables the button and shows a spinner.
 */
export function QueryInput({
  value,
  onChange,
  onRun,
  loading,
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
      </Box>
    </Box>
  );
}
