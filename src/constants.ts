// ─── Layout ───────────────────────────────────────────────────────────────────
export const SIDEBAR_WIDTH = 360;
export const APPBAR_HEIGHT = 64;

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export const ACCORDION_SECTIONS: { id: string; label: string }[] = [
  { id: "countries", label: "Country" },
  { id: "companyCategories", label: "Company Category" },
  { id: "includedTechList", label: "Allowed Technology" },
  { id: "excludedTechList", label: "Excluded Technology" },
  { id: "minNumberOfTech", label: "Minimum Number of Technologies" },
  { id: "maxNumberOfTech", label: "Maximum Number of Technologies" },
  { id: "includedTechCategoryList", label: "Allowed Technology Category" },
  { id: "excludedTechCategoryList", label: "Excluded Technology Category" },
];

// ─── Dashboard stat-card accent colours ───────────────────────────────────────
export const STAT_CARD_COLORS = {
  companyCategories: "#1976d2",
  countries: "#9c27b0",
  technologies: "#4caf50",
  techCategories: "#ff9800",
} as const;
