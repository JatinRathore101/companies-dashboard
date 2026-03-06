/** Props for the MultiSelectAutocomplete component. */
export interface MultiSelectAutocompleteProps {
  /** Label shown on the input field. */
  label: string;
  /** Full list of selectable options. */
  options: string[];
  /** Currently selected values (controlled). */
  value: string[];
  /** Called with the new selection whenever it changes. */
  onChange: (value: string[]) => void;
}
