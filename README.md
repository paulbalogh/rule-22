# Rule 22

An interactive **1D cellular automaton** visualizer.

This app simulates a line of binary cells (0/1) over multiple generations using the rule:

- **Next cell is 1 iff exactly one of (Left, Current, Right) is 1**; otherwise it becomes 0.
- **Boundary cells** assume the missing neighbor is 0.
- **Each generation is computed from the previous generation** (all updates happen “at once” per step).

The UI lets you tweak the configuration, run/pause/reset the simulation, and see both the grid and a small chart of **ones per generation**.

## Features

- **Configurable simulation**: total cells, number of initially-on cells (random unique positions), number of generations, tick delay
- **Live visualization**: 10-cells-per-row grid + “ones per generation” bar chart that grows as the simulation runs
- **Theme switcher**: light / dark / system (stored locally)

## Tech stack

- **React + TypeScript** (Vite)
- **Tailwind CSS** (via `@tailwindcss/vite`)
- **Vercel** friendly SPA routing (see `vercel.json`)

## Getting started

Install dependencies (this repo uses `pnpm-lock.yaml`):

```bash
pnpm install
```

Run the dev server:

```bash
pnpm dev
```

Build for production:

```bash
pnpm build
```

Preview the production build locally:

```bash
pnpm preview
```

## Project structure (high-level)

- `src/Rule22.tsx`: UI (controls, chart, grid)
- `src/useRule22.ts`: simulation engine (state + stepping logic)
- `src/useTheme.ts`, `src/ThemeSwitcher.tsx`: theme handling + UI

## Deployment

Deploy as a static SPA. `vercel.json` includes a rewrite so deep links route back to `index.html`.
