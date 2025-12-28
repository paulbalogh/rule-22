# rule-22

An interactive **elementary cellular automaton (ECA)** visualizer (1D, binary states) built with React + TypeScript.

The simulator supports **all 256 elementary rules (0–255)** and renders a **space‑time diagram** (each row = one generation).

Boundary behavior is **stitched/wrap-around** (the last cell neighbors the first).

## Features

- **All 256 ECA rules (0–255)**: pick a rule and see the corresponding (L,C,R) truth table.
- **Space‑time diagram**: tiny dots, one row per generation, auto-scrolls as the simulation runs.
- **Run controls**: rule selector + start/stop + **Random rule**.
- **Tunable parameters** (collapsed panel): total cells, number of seeds, generations, delay.
- **Theme switcher**: light / dark / system (in the footer, persisted locally).
- **Shareable URLs**: the rule + controls + exact seed positions are encoded in the URL.
- **Share button**: one-click copy-to-clipboard with a small “copied” toast.

## Defaults

- **Rule**: 22
- **Cells**: 118
- **Generations**: 100
- **Delay**: 10ms
- **Seeds**: half the cells (randomly placed)

## Sharing (URL state)

The current configuration is encoded in the query string, so you can copy/paste a link and get the same automaton.

Parameters:

- **`r`**: rule decimal (0–255)
- **`w`**: cells per generation (1–300)
- **`g`**: generations (1–500)
- **`d`**: delay in ms (10–5000)
- **`s`**: seed bitset (base64url). This encodes the exact seed cell positions.

Behavior:

- **On load**: if any of the share parameters are present, the simulation **auto-starts**.
- **On changes**: updates to the controls/rule update the URL and reset the diagram generation.
- **Start**: always available; clicking Start rebuilds/restarts the diagram with the current configuration.

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
- `src/urlState.ts`: URL encode/decode helpers for shareable configuration
- `src/theme.ts`, `src/useTheme.ts`, `src/ThemeSwitcher.tsx`: theme handling

## Repository

- `https://github.com/paulbalogh/rule-22`

## Deployment

Deploy as a static SPA. `vercel.json` includes a rewrite so deep links route back to `index.html`.
