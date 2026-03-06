"use client";

import { memo, useCallback } from "react";

import { Autocomplete, TextField } from "@mui/material";

import type { MultiSelectAutocompleteProps } from "./types";

/**
 * Reusable multi-select autocomplete backed by MUI Autocomplete.
 *
 * Wraps `Autocomplete` with `multiple` and `filterSelectedOptions` so already-
 * chosen items are removed from the dropdown, preventing duplicate selections.
 * Memoised to avoid re-renders when unrelated parent state changes.
 *
 * @param props.label    - Input label text.
 * @param props.options  - Full list of available string options.
 * @param props.value    - Controlled array of selected values.
 * @param props.onChange - Callback fired with the updated selection array.
 */
export const MultiSelectAutocomplete = memo(function MultiSelectAutocomplete({
  label,
  options,
  value,
  onChange,
}: MultiSelectAutocompleteProps) {
  const handleChange = useCallback(
    (_: React.SyntheticEvent, newValue: string[]) => {
      onChange(newValue);
    },
    [onChange],
  );

  return (
    <Autocomplete
      multiple
      filterSelectedOptions
      options={options}
      value={value}
      onChange={handleChange}
      size="small"
      renderInput={(params) => <TextField {...params} label={label} />}
    />
  );
});
