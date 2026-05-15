# Indian BBS Generator

A Next.js App Router application for generating Indian construction Bar Bending Schedules (BBS) for beams, slabs, columns, footings and walls / NS walls.

## Features

- Dynamic element-specific input forms with React Hook Form and Zod validation.
- Centralized TypeScript calculation engine under `lib/calculations` and auditable formulas under `lib/formulas`.
- BBS table with cutting length, quantity, unit weight, total length and total steel weight.
- SVG bar shape diagrams for straight, L, U, cranked, stirrup, mesh and wall reinforcement cases.
- Formula Reference panel showing each named rule, expression and source concept.
- Local project persistence with save, duplicate and search.
- CSV export, PDF export through jsPDF, copy table and print-friendly A4 landscape layout.

## Formula approach

The app uses explicit BBS/takeoff formulas rather than hiding engineering assumptions. Values that depend on design output, such as development length or lap length, are accepted as user-entered multipliers (`Ld = factor × d`, `lap = factor × d`) instead of being guessed from incomplete design data.

Implemented formula modules include:

- `calculateWeight()` — standard BBS shortcut: `Weight (kg) = Length (m) × d² / 162`.
- `calculateBarQuantityBySpacing()` — `floor(run / spacing) + 1`.
- `calculateCuttingLengthStirrups()` — perimeter plus hooks minus bend deductions.
- `calculateDevelopmentLength()` and `calculateLapLength()` — explicit project-input factors.
- `calculateBendAllowance()` — IS 2502 concept selector for bend deductions.
- `calculateCrankExtraLength()` — crank offset and selected angle.

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Quality commands

```bash
npm run typecheck
npm test
npm run build
```

## Project structure

```text
app/                  Next.js app and print styles
components/           UI, input form, BBS table and SVG diagrams
lib/calculations/     Element-specific calculation engine and demo data
lib/formulas/         Central named engineering formulas
lib/validation/       Zod schemas and engineering validation
types/                TypeScript domain model
lib/export/           CSV and PDF export helpers
lib/storage/          localStorage persistence
```

## Engineering disclaimer

The application aligns with Indian RCC detailing concepts and common BBS practices, but it does not claim full code compliance for a member design unless the formula implementation is explicitly mapped and reviewed against project drawings and governing codes. IS 456, IS 2502, IS 1786 and IS 13920 concepts are represented in the architecture so additional project-specific checks can be added cleanly.
