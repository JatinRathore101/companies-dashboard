import React, { useState } from "react";
import SearchBar from "./searchbar/searchbar";
import { Box, Button } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { companiesTableSliceActions } from "@/store/slices/companiesTableSlice";
import { RootState } from "@/store";

const CompaniesSearchBar = () => {
  const dispatch = useDispatch();
  const filters = useSelector(
    (state: RootState) => state.companiesTable.filters,
  );

  const [searchStr, setSearchStr] = useState<string>(filters.searchStr);
  const handleApply = () => {
    dispatch(companiesTableSliceActions.setSearchStr(searchStr?.trim()));
  };

  return (
    <React.Fragment>
      <SearchBar
        label=""
        placeholder={`Search by company name or domain (e.g., google.com or .co.uk)`}
        value={searchStr}
        setValue={(v) => setSearchStr(v)}
      />
      <Button
        sx={{ width: "100px" }}
        variant="contained"
        fullWidth
        onClick={handleApply}
      >
        Search
      </Button>
    </React.Fragment>
  );
};

export default CompaniesSearchBar;
