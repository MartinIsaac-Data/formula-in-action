# @formula-in-action/excel-addin

The Excel task pane — React 18 + Vite + Fluent UI v9 on Office.js. The only
Excel-aware code in the repo; everything else is reused from `packages/*` via the
`@formula-in-action/api` service.

## Prerequisites

- The API running (`pnpm --filter @formula-in-action/api dev` → `https://localhost:8787`).
- Office dev certificates installed once:
  ```bash
  pnpm --filter @formula-in-action/excel-addin certs
  ```

## Develop

```bash
pnpm --filter @formula-in-action/excel-addin manifest:dev   # render manifest/manifest.dev.xml
pnpm --filter @formula-in-action/excel-addin dev             # Vite on https://localhost:3000
pnpm --filter @formula-in-action/excel-addin sideload        # open Excel desktop with the add-in
```

For **Excel on the web**: upload `manifest/manifest.dev.xml` via *Add-ins →
Upload My Add-in* while the dev server runs.

Stop the desktop sideload with `… sideload:stop`.

## What it does

1. `useSelectedFormula` reads the selected cell's formula via `Excel.run` and
   re-reads on `onSelectionChanged`. Handles no selection / value (not a formula)
   / multi-cell / API errors.
2. `useExplanation` POSTs `{ formula, mode, context, cellAddress, sheetNames,
   namedRanges }` to `/v1/explain` (aborting stale requests) — **never cell
   values**.
3. Tabs: **Overview** (what it does + KPI + functions) · **Step-by-step** ·
   **Example** (Formula in Action) · **Issues** · **Improve**.
4. Mode (Simple / Technical / In Action) and context (7 domains) persist per user
   via `Office.roamingSettings` (localStorage fallback).
5. Theme follows Office / OS with a manual toggle; `degraded` responses are
   labelled "Offline explanation".

## Structure

```
src/taskpane/
  index.tsx            Office.onReady → render
  App.tsx              layout + state wiring
  office/excelContext  all Excel.run lives here
  hooks/               useSelectedFormula · useExplanation · usePreferences
  services/apiClient   fetch wrapper + ApiError
  theme/useOfficeTheme light/dark resolution
  components/          Header · FormulaBlock · ModeSwitcher · ContextPicker ·
                       FunctionsTable · tabs/* · states/* · actions/*
src/commands/          ribbon command file
manifest/              XML template + build-manifest.ts (dev/prod render)
public/                served verbatim: assets/ (icons), privacy.html, support.html
```

## Build

```bash
pnpm --filter @formula-in-action/excel-addin build   # tsc --noEmit + vite build + manifest:prod
```

Set `ADDIN_PROD_URL` (and `VITE_API_BASE_URL`) for a real deployment. Regenerate
`ADDIN_ID` with `crypto.randomUUID()` before AppSource submission.
