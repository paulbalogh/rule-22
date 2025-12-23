# rule-22

An interactive **elementary cellular automaton (ECA)** visualizer (1D, binary states) built with React + TypeScript.

The simulator supports **all 256 elementary rules (0–255)** and renders a **space‑time diagram** (each row = one generation).

Boundary behavior is **stitched/wrap-around** (the last cell neighbors the first).

## Features

- **All 256 ECA rules (0–255)**: pick a rule and see the corresponding (L,C,R) truth table.
- **Space‑time diagram**: tiny dots, one row per generation, auto-scrolls as the simulation runs.
- **Run controls**: rule selector + start/stop/reset (changing rule stops + resets).
- **Tunable parameters** (collapsed panel): total cells, initial ones, generations, delay.
- **Ones per generation chart** (collapsed by default): quick density signal over time.
- **Theme switcher**: light / dark / system (in the footer, persisted locally).

## Defaults

- **Rule**: 22
- **Cells**: 118
- **Generations**: 100
- **Delay**: 10ms

## Tech stack

- **React + TypeScript** (Vite)
- **Tailwind CSS**
- **Vercel-friendly** SPA routing (see `vercel.json`)

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

- `src/useElementaryAutomaton.ts`: simulation engine (rule application + stepping + history)
- `src/Rule22.tsx`: UI (rule&run, controls, ones chart, space‑time diagram)
- `src/theme.ts`, `src/useTheme.ts`, `src/ThemeSwitcher.tsx`: theme handling

## Repository

- `https://github.com/paulbalogh/rule-22`

## Deployment

Deploy as a static SPA. `vercel.json` includes a rewrite so deep links route back to `index.html`.
