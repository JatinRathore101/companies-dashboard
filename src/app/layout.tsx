/**
 * app/layout.tsx — Root layout (Server Component)
 *
 * Architecture decisions:
 * - AppRouterCacheProvider from @mui/material-nextjs flushes emotion's
 *   CSS-in-JS styles into the server-rendered HTML, preventing a flash
 *   of unstyled content on first paint.
 * - The layout stays a pure Server Component; ThemeProvider lives in
 *   page.tsx (a Client Component) to keep the theme toggle interactive.
 */

import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";

export const metadata: Metadata = {
  title: "Company Data Explorer",
  description: "Query and explore company data with SQL",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </head>
      <body style={{ margin: 0 }}>
        {/* AppRouterCacheProvider enables MUI emotion SSR in Next.js App Router */}
        <AppRouterCacheProvider>{children}</AppRouterCacheProvider>
      </body>
    </html>
  );
}
