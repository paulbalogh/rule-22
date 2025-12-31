/**
 * Rule22
 *
 * A component that displays a number of blocks, each of which is either 0 or 1.
 * It runs an elementary cellular automaton (ECA) on the blocks.
 * Each generation the blocks are updated by an 8-bit rule (0..255) applied to
 * the (L, C, R) neighborhood. Boundary conditions assume the missing neighbor is 0.
 * It takes the following props:
 * - the total number of items (how many blocks to display), default is 100 (show 10 per row)
 * - how many of the initial blocks are 1 (assigned randomly), default 1 block
 * - how many generations to run, default 100
 * - the default delay between each block valuation
 *
 * Important: the blocks are evaluated at once per generation, based on the conditions of the previous generation.
 *
 * @returns A div that displays the blocks and the current generation with a nice animation when blocks are evaluated and between generations.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { to8BitBinary } from "./rules";
import {
  buildShareableSearch,
  parseShareableStateFromLocation,
} from "./urlState";
import { useElementaryAutomaton } from "./useElementaryAutomaton";
import { useStarredConfigs } from "./useStarredConfigs";

interface Rule22Props {
  totalItems?: number;
  initialOnes?: number;
  generations?: number;
  delay?: number;
}

function clampInt(value: number, min: number, max: number) {
  const v = Number.isFinite(value) ? Math.floor(value) : min;
  return Math.max(min, Math.min(max, v));
}

type RuleOption = { decimal: number; binary: string };

function randomSeedIndices(totalItems: number, count: number): number[] {
  const n = clampInt(count, 0, totalItems);
  const indices = Array.from({ length: totalItems }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, n).sort((a, b) => a - b);
}

function defaultSeedCount(totalItems: number) {
  return clampInt(Math.floor(totalItems / 2), 0, totalItems);
}

function normalizeSeedIndices(
  totalItems: number,
  seedIndices: number[]
): number[] {
  const set = new Set<number>();
  for (const idx of seedIndices) {
    if (!Number.isFinite(idx)) continue;
    const i = Math.floor(idx);
    if (i < 0 || i >= totalItems) continue;
    set.add(i);
  }
  return Array.from(set).sort((a, b) => a - b);
}

type ControlState = {
  totalItems: number;
  generations: number;
  delay: number;
  seedIndices: number[];
  initialOnes: number;
};

function applyControlPatch<T extends ControlState>(
  prev: T,
  patch: Partial<ControlState>
): T {
  const merged = { ...prev, ...patch };
  const safeTotal = clampInt(merged.totalItems, 1, 300);
  const safeGenerations = clampInt(merged.generations, 1, 500);
  const safeDelay = clampInt(merged.delay, 10, 5_000);
  const safeSeed = normalizeSeedIndices(safeTotal, merged.seedIndices ?? []);
  const safeInitial = clampInt(safeSeed.length, 0, safeTotal);
  return {
    ...merged,
    totalItems: safeTotal,
    generations: safeGenerations,
    delay: safeDelay,
    seedIndices: safeSeed,
    initialOnes: safeInitial,
  };
}

function RuleDetailsPanel({
  ruleDecimal,
  ruleBinary,
}: {
  ruleDecimal: number;
  ruleBinary: string;
}) {
  const rows = useMemo(() => {
    // Show neighborhoods in the conventional order: 111, 110, ..., 000
    return Array.from({ length: 8 }, (_, i) => {
      const idx = 7 - i;
      const left = ((idx >> 2) & 1) as 0 | 1;
      const current = ((idx >> 1) & 1) as 0 | 1;
      const right = (idx & 1) as 0 | 1;
      const out = ((ruleDecimal >> idx) & 1) as 0 | 1;
      return { idx, left, current, right, out };
    });
  }, [ruleDecimal]);

  const cellClass = (v: 0 | 1) =>
    `h-2 w-2 rounded-lg ring-1 ${
      v === 1
        ? "bg-blue-600 ring-blue-700/30 dark:bg-sky-400 dark:ring-sky-300/30"
        : "bg-slate-200 ring-slate-300 dark:bg-slate-800 dark:ring-slate-700"
    }`;

  return (
    <details className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/30">
      <summary className="cursor-pointer list-none select-none text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
        Rule {ruleDecimal} details
      </summary>

      <div className="mt-3">
        <div className="text-xs text-slate-600 dark:text-slate-300">
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            Rule {ruleDecimal}
          </span>{" "}
          • binary{" "}
          <span className="font-mono text-slate-900 dark:text-slate-100">
            {ruleBinary}
          </span>{" "}
          <span className="text-slate-400 dark:text-slate-500">(111→000)</span>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2">
          {rows.map((r) => (
            <div
              key={r.idx}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950/40"
            >
              <div className="flex items-center gap-2">
                <div className={cellClass(r.left)} title="L" />
                <div className={cellClass(r.current)} title="C" />
                <div className={cellClass(r.right)} title="R" />
                <div className="mx-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
                  →
                </div>
                <div className={cellClass(r.out)} title="Next" />
              </div>

              <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                {r.left}
                {r.current}
                {r.right} → {r.out}
              </div>
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}

function AboutWolframRulesPanel() {
  return (
    <details className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/30">
      <summary className="cursor-pointer list-none select-none text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
        What are these rules?
      </summary>

      <div className="mt-3 space-y-3 text-sm text-slate-700 dark:text-slate-200">
        <p>
          Wolfram’s rules describe how very simple systems can evolve over time.
          Each rule tells a row of cells how to update itself using only its
          immediate neighbours, yet when you repeat this tiny instruction again
          and again, you can get wildly different outcomes: some patterns
          quickly freeze, some repeat forever, some dissolve into apparent
          randomness, and a rare few generate rich, evolving structures that can
          carry information.
        </p>

        <a
          href="https://en.wikipedia.org/wiki/Elementary_cellular_automaton"
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center text-sm font-semibold text-sky-700 underline-offset-4 hover:underline dark:text-sky-300"
        >
          Further reading
        </a>
      </div>
    </details>
  );
}

function RuleAndRunPanel({
  ruleOptions,
  ruleDecimal,
  onChangeRule,
  isRunning,
  canToggleRun,
  onToggleRun,
  onRandomRule,
}: {
  ruleOptions: ReadonlyArray<RuleOption>;
  ruleDecimal: number;
  onChangeRule: (nextRuleDecimal: number) => void;
  isRunning: boolean;
  canToggleRun: boolean;
  onToggleRun: () => void;
  onRandomRule: () => void;
}) {
  return (
    <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <label className="flex w-full flex-col gap-1 sm:max-w-60">
        <select
          value={ruleDecimal}
          onChange={(e) => onChangeRule(Number(e.target.value))}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-slate-400 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 dark:focus-visible:ring-slate-600"
        >
          {ruleOptions.map((r) => (
            <option key={r.decimal} value={r.decimal}>
              Rule {r.decimal} ({r.binary})
            </option>
          ))}
        </select>
      </label>

      <div className="flex w-full items-center gap-2 sm:w-auto">
        <button
          type="button"
          onClick={onToggleRun}
          disabled={!canToggleRun}
          className={`inline-flex h-10 flex-1 items-center justify-center rounded-xl px-4 text-sm font-semibold shadow-sm transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none ${
            isRunning
              ? "border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200 dark:hover:bg-rose-950/50"
              : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          }`}
        >
          {isRunning ? "Stop" : "Start"}
        </button>
        <button
          type="button"
          onClick={onRandomRule}
          className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 active:translate-y-px sm:flex-none dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 dark:hover:bg-slate-900/30"
        >
          Random
        </button>
      </div>
    </div>
  );
}

function ControlsPanel({
  draft,
  applied,
  currentGeneration,
  autorunOnChange,
  onToggleAutorunOnChange,
  onRandomizeSeeds,
  onControlsPatch,
}: {
  draft: {
    totalItems: number;
    initialOnes: number;
    seedIndices: number[];
    generations: number;
    delay: number;
  };
  applied: {
    totalItems: number;
    initialOnes: number;
    seedIndices: number[];
    generations: number;
    delay: number;
  };
  currentGeneration: number;
  autorunOnChange: boolean;
  onToggleAutorunOnChange: (next: boolean) => void;
  onRandomizeSeeds: () => void;
  onControlsPatch: (patch: Partial<ControlState>) => void;
}) {
  return (
    <details className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/30">
      <summary className="cursor-pointer list-none select-none text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
        Controls
      </summary>

      <div className="mt-3 grid grid-cols-4 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
            Cells
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={300}
            value={draft.totalItems}
            onChange={(e) =>
              onControlsPatch({ totalItems: Number(e.target.value) })
            }
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-slate-400 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 dark:focus-visible:ring-slate-600"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
            Generations
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={500}
            value={draft.generations}
            onChange={(e) =>
              onControlsPatch({ generations: Number(e.target.value) })
            }
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-slate-400 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 dark:focus-visible:ring-slate-600"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
            Seed
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={Math.max(0, draft.totalItems)}
            value={draft.initialOnes}
            onChange={(e) =>
              (() => {
                const safeTotal = clampInt(draft.totalItems, 1, 300);
                const nextCount = clampInt(
                  Number(e.target.value),
                  0,
                  safeTotal
                );
                const seedIndices = randomSeedIndices(safeTotal, nextCount);
                onControlsPatch({
                  totalItems: safeTotal,
                  initialOnes: seedIndices.length,
                  seedIndices,
                });
              })()
            }
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-slate-400 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 dark:focus-visible:ring-slate-600"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
            Delay (ms)
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={10}
            max={5000}
            step={10}
            value={draft.delay}
            onChange={(e) => onControlsPatch({ delay: Number(e.target.value) })}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-slate-400 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 dark:focus-visible:ring-slate-600"
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-600 dark:text-slate-300">
          Generation{" "}
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {currentGeneration}
          </span>{" "}
          / {applied.generations}
          <span className="mx-2 text-slate-300 dark:text-slate-700">•</span>
          Items{" "}
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {applied.totalItems}
          </span>
          , Ones{" "}
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {applied.initialOnes}
          </span>
          , Delay{" "}
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {applied.delay}ms
          </span>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
          <label className="inline-flex h-10 w-full select-none items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm sm:w-auto dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100">
            <span className="text-sm font-semibold">Autorun on change</span>
            <input
              type="checkbox"
              checked={autorunOnChange}
              onChange={(e) => onToggleAutorunOnChange(e.target.checked)}
              className="h-4 w-4 accent-sky-600"
            />
          </label>
          <button
            type="button"
            onClick={onRandomizeSeeds}
            className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 dark:hover:bg-slate-900/30"
          >
            Randomize seeds
          </button>
        </div>
      </div>
    </details>
  );
}

function SpaceTimeDiagram({
  appliedTotalItems,
  totalGenerations,
  generation,
  blocksHistory,
  seedKey,
}: {
  appliedTotalItems: number;
  totalGenerations: number;
  generation: number;
  blocksHistory: Array<{ generation: number; blocks: Array<0 | 1> }>;
  seedKey: string;
}) {
  const spaceTimeRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevGenRef = useRef(generation);
  const prevConfigKeyRef = useRef<string>("");
  const [themeVersion, setThemeVersion] = useState(0);

  // Approximate needed height: each row ~2px dot + 1px gap = ~3px.
  // Use the configured total generations so the container height matches the expected full run.
  const approxMinHeightPx = (totalGenerations + 1) * 3 + 16;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const obs = new MutationObserver(() => setThemeVersion((v) => v + 1));
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const step = 3; // 2px dot + 1px gap
    const dot = 2;
    const rows = Math.max(1, totalGenerations + 1);
    const cols = Math.max(1, appliedTotalItems);
    const logicalW = cols * step;
    const logicalH = rows * step;
    const dpr =
      typeof window !== "undefined"
        ? Math.max(1, window.devicePixelRatio || 1)
        : 1;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const isDark =
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark");
    const onColor = isDark ? "#38bdf8" : "#2563eb"; // sky-400 / blue-600
    const offColor = isDark ? "#1e293b" : "#e2e8f0"; // slate-800 / slate-200

    // Include seedKey so we force a redraw when the initial condition changes
    // (otherwise generation can stay at 0 and we'd keep stale pixels).
    const configKey = `${cols}|${rows}|${themeVersion}|${seedKey}`;
    const shouldFullRedraw =
      prevConfigKeyRef.current !== configKey || generation < prevGenRef.current;

    // Ensure a stable backing store size (prevents reallocating on every generation).
    const nextBackingW = Math.floor(logicalW * dpr);
    const nextBackingH = Math.floor(logicalH * dpr);
    if (canvas.width !== nextBackingW) canvas.width = nextBackingW;
    if (canvas.height !== nextBackingH) canvas.height = nextBackingH;
    canvas.style.width = `${logicalW}px`;
    canvas.style.height = `${logicalH}px`;

    // Reset transform after size changes.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;

    const drawRow = (rowIndex: number) => {
      const row = blocksHistory[rowIndex];
      if (!row) return;

      const y = rowIndex * step;
      // Clear the row strip, then redraw cells.
      ctx.clearRect(0, y, logicalW, step);
      for (let x = 0; x < cols; x++) {
        const v = row.blocks[x] ?? 0;
        ctx.fillStyle = v === 1 ? onColor : offColor;
        // Draw a small "dot" circle (matches the old rounded-full 2px div).
        const cx = x * step + dot / 2;
        const cy = y + dot / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, dot / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    if (shouldFullRedraw) {
      ctx.clearRect(0, 0, logicalW, logicalH);
      const maxRow = Math.min(generation, rows - 1);
      for (let r = 0; r <= maxRow; r++) drawRow(r);
    } else if (generation > prevGenRef.current) {
      const from = Math.max(0, prevGenRef.current + 1);
      const to = Math.min(generation, rows - 1);
      for (let r = from; r <= to; r++) drawRow(r);
    }

    prevGenRef.current = generation;
    prevConfigKeyRef.current = configKey;

    const el = spaceTimeRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [
    appliedTotalItems,
    blocksHistory,
    generation,
    seedKey,
    themeVersion,
    totalGenerations,
  ]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/30">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          Space-time diagram
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {appliedTotalItems} cells × {generation + 1} generations
        </div>
      </div>

      <div className="mt-3">
        <div
          ref={spaceTimeRef}
          className="overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950/40"
          style={{ minHeight: `${approxMinHeightPx}px` }}
        >
          <canvas
            ref={canvasRef}
            role="img"
            aria-label="Space-time diagram"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
      </div>
    </div>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={filled ? "fill-current" : "fill-none"}
    >
      <path
        d="M12 17.3l-6.18 3.54 1.64-7.03L2 8.9l7.19-.62L12 1.5l2.81 6.78L22 8.9l-5.46 4.91 1.64 7.03L12 17.3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Rule22({
  totalItems = 118,
  initialOnes,
  generations = 100,
  delay = 10,
}: Rule22Props) {
  const ruleOptions = useMemo(
    () =>
      Array.from({ length: 256 }, (_, decimal) => ({
        decimal,
        binary: to8BitBinary(decimal),
      })),
    []
  );

  // "Draft" inputs (editable) + "applied" config (drives the simulation)
  const [draft, setDraft] = useState(() => {
    const fromUrl =
      typeof window !== "undefined"
        ? parseShareableStateFromLocation(window.location)
        : {};
    const safeTotal = clampInt(fromUrl.totalItems ?? totalItems, 1, 300);
    const safeRule = clampInt(fromUrl.ruleDecimal ?? 22, 0, 255);
    const safeGenerations = clampInt(
      fromUrl.generations ?? generations,
      1,
      500
    );
    const safeDelay = clampInt(fromUrl.delay ?? delay, 10, 5_000);
    const seedIndices =
      fromUrl.seedIndices && fromUrl.seedIndices.length > 0
        ? normalizeSeedIndices(safeTotal, fromUrl.seedIndices)
        : randomSeedIndices(
            safeTotal,
            clampInt(initialOnes ?? defaultSeedCount(safeTotal), 0, safeTotal)
          );

    return {
      ruleDecimal: safeRule,
      totalItems: safeTotal,
      initialOnes: seedIndices.length,
      seedIndices,
      generations: safeGenerations,
      delay: safeDelay,
    };
  });

  const [config, setConfig] = useState(() => ({
    ruleDecimal: draft.ruleDecimal,
    totalItems: draft.totalItems,
    initialOnes: draft.initialOnes,
    seedIndices: draft.seedIndices,
    generations: draft.generations,
    delay: draft.delay,
  }));

  const applied = useMemo(() => {
    const safeRuleDecimal = clampInt(config.ruleDecimal, 0, 255);
    const safeTotal = clampInt(config.totalItems, 1, 300);
    const safeSeed = normalizeSeedIndices(safeTotal, config.seedIndices ?? []);
    const safeInitial = clampInt(
      Number.isFinite(config.initialOnes)
        ? config.initialOnes
        : safeSeed.length,
      0,
      safeTotal
    );
    const safeGenerations = clampInt(config.generations, 1, 500);
    const safeDelay = clampInt(config.delay, 10, 5_000);
    return {
      ruleDecimal: safeRuleDecimal,
      totalItems: safeTotal,
      initialOnes: safeInitial,
      seedIndices: safeSeed,
      generations: safeGenerations,
      delay: safeDelay,
    };
  }, [
    config.delay,
    config.generations,
    config.initialOnes,
    config.ruleDecimal,
    config.totalItems,
    config.seedIndices,
  ]);

  const ruleMeta = useMemo(
    () => ({
      name: `Rule ${applied.ruleDecimal}`,
      decimal: applied.ruleDecimal,
      binary: to8BitBinary(applied.ruleDecimal),
    }),
    [applied.ruleDecimal]
  );

  const { generation, isRunning, blocksHistory, start, stop, reset } =
    useElementaryAutomaton({
      ...applied,
      seedIndices: applied.seedIndices,
    });

  const [shareLabel, setShareLabel] = useState("Share this automaton");
  const shareLabelTimerRef = useRef<number | null>(null);
  const didAutoStartRef = useRef(false);
  const [autorunOnChange, setAutorunOnChange] = useState(true);
  const pendingAutoStartRef = useRef(false);

  const starred = useStarredConfigs({
    ruleDecimal: applied.ruleDecimal,
    totalItems: applied.totalItems,
    generations: applied.generations,
    delay: applied.delay,
    seedIndices: applied.seedIndices,
  });

  const hasStarred = starred.items.length > 0;

  const syncUrlNow = useCallback(
    (next: {
      ruleDecimal: number;
      totalItems: number;
      generations: number;
      delay: number;
      seedIndices: number[];
    }) => {
      if (typeof window === "undefined") return;
      const nextSearch = buildShareableSearch({
        ruleDecimal: next.ruleDecimal,
        totalItems: next.totalItems,
        generations: next.generations,
        delay: next.delay,
        seedIndices: next.seedIndices,
      });
      const nextUrl = `${window.location.pathname}${nextSearch}${window.location.hash}`;
      window.history.replaceState(null, "", nextUrl);
    },
    []
  );

  // Keep the URL in sync with the *applied* configuration.
  useEffect(() => {
    if (typeof window === "undefined") return;
    syncUrlNow(applied);
  }, [applied, syncUrlNow]);

  // Auto-start when loading from a shareable URL configuration.
  useEffect(() => {
    if (didAutoStartRef.current) return;
    didAutoStartRef.current = true;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const hasConfig = ["r", "w", "g", "d", "s"].some((k) => params.has(k));
    if (hasConfig) start();
  }, [start]);

  // If a parameter change requested an auto-run, start once the new *applied* config is in place.
  const appliedKey = useMemo(
    () =>
      [
        applied.ruleDecimal,
        applied.totalItems,
        applied.generations,
        applied.delay,
        applied.seedIndices.join(","),
      ].join("|"),
    [
      applied.delay,
      applied.generations,
      applied.ruleDecimal,
      applied.seedIndices,
      applied.totalItems,
    ]
  );

  useEffect(() => {
    // Intentionally reference appliedKey so the hook dependency reflects what triggers this effect.
    void appliedKey;
    if (!pendingAutoStartRef.current) return;
    pendingAutoStartRef.current = false;
    // `useElementaryAutomaton` re-seeds on some config changes using `setTimeout(0)` and sets `isRunning: false`.
    // To avoid a race where we start and then immediately get stopped by that internal re-seed, schedule our start
    // after that tick as well.
    if (typeof window === "undefined") return;
    const t = window.setTimeout(() => start(), 0);
    return () => window.clearTimeout(t);
  }, [appliedKey, start]);

  // Clean up any outstanding label timer.
  useEffect(() => {
    return () => {
      if (typeof window === "undefined") return;
      if (shareLabelTimerRef.current)
        window.clearTimeout(shareLabelTimerRef.current);
    };
  }, []);

  const canStart = !isRunning;
  const canStop = isRunning;
  const canToggleRun = isRunning ? canStop : canStart;

  const applyControlsPatch = useCallback(
    (patch: Partial<ControlState>) => {
      let nextPatch = patch;
      if (
        typeof patch.totalItems === "number" &&
        patch.seedIndices == null &&
        patch.initialOnes == null
      ) {
        const safeTotal = clampInt(patch.totalItems, 1, 300);
        const count = defaultSeedCount(safeTotal);
        const seedIndices = randomSeedIndices(safeTotal, count);
        nextPatch = {
          ...patch,
          totalItems: safeTotal,
          initialOnes: count,
          seedIndices,
        };
      }

      stop();
      reset();
      setDraft((prev) => applyControlPatch(prev, nextPatch));
      setConfig((prev) => applyControlPatch(prev, nextPatch));
      pendingAutoStartRef.current = autorunOnChange;
    },
    [autorunOnChange, reset, stop]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Cellular automaton
          </div>
          <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
            {ruleMeta.name} • binary{" "}
            <span className="font-mono">{ruleMeta.binary}</span>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white pl-3 pr-1 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
          <span className="text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
            {ruleMeta.decimal}
          </span>
          <button
            type="button"
            onClick={starred.toggleCurrent}
            aria-label={
              starred.isStarred
                ? "Remove current configuration from starred"
                : "Star current configuration"
            }
            title={
              starred.isStarred
                ? "Unstar this configuration"
                : "Star this configuration"
            }
            className={`inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-50 active:translate-y-px dark:text-slate-200 dark:hover:bg-slate-900/30 ${
              starred.isStarred
                ? "border-amber-200  text-amber-800 dark:border-amber-900/40  dark:text-amber-200"
                : "border-slate-200  dark:border-slate-800"
            }`}
          >
            <StarIcon filled={starred.isStarred} />
          </button>
        </div>
      </div>

      <RuleAndRunPanel
        ruleOptions={ruleOptions}
        ruleDecimal={draft.ruleDecimal}
        onChangeRule={(value) => {
          const nextRule = clampInt(value, 0, 255);
          setDraft((d) => ({ ...d, ruleDecimal: nextRule }));
          setConfig((c) => ({ ...c, ruleDecimal: nextRule }));
          stop();
          reset();
          pendingAutoStartRef.current = autorunOnChange;
          syncUrlNow({
            ruleDecimal: nextRule,
            totalItems: applied.totalItems,
            generations: applied.generations,
            delay: applied.delay,
            seedIndices: applied.seedIndices,
          });
        }}
        isRunning={isRunning}
        canToggleRun={canToggleRun}
        onToggleRun={isRunning ? stop : start}
        onRandomRule={() => {
          const nextRule = Math.floor(Math.random() * 256);
          setDraft((d) => ({ ...d, ruleDecimal: nextRule }));
          setConfig((c) => ({ ...c, ruleDecimal: nextRule }));
          stop();
          reset();
          syncUrlNow({
            ruleDecimal: nextRule,
            totalItems: applied.totalItems,
            generations: applied.generations,
            delay: applied.delay,
            seedIndices: applied.seedIndices,
          });
          pendingAutoStartRef.current = autorunOnChange;
        }}
      />

      <AboutWolframRulesPanel />

      <RuleDetailsPanel
        ruleDecimal={ruleMeta.decimal}
        ruleBinary={ruleMeta.binary}
      />

      <ControlsPanel
        draft={draft}
        applied={applied}
        currentGeneration={generation}
        autorunOnChange={autorunOnChange}
        onToggleAutorunOnChange={setAutorunOnChange}
        onRandomizeSeeds={() => {
          const safeTotal = clampInt(draft.totalItems, 1, 300);
          const safeCount = clampInt(draft.initialOnes, 0, safeTotal);
          const seedIndices = randomSeedIndices(safeTotal, safeCount);
          applyControlsPatch({
            totalItems: safeTotal,
            initialOnes: seedIndices.length,
            seedIndices,
          });
        }}
        onControlsPatch={applyControlsPatch}
      />

      <SpaceTimeDiagram
        appliedTotalItems={applied.totalItems}
        totalGenerations={applied.generations}
        generation={generation}
        blocksHistory={blocksHistory}
        seedKey={applied.seedIndices.join(",")}
      />

      {hasStarred ? (
        <details
          open
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/30"
        >
          <summary className="cursor-pointer list-none select-none text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            Starred
          </summary>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {starred.items.map((it) => (
              <a
                key={it.id}
                href={it.search}
                className={`inline-flex h-10 items-center rounded-xl border px-3 text-sm font-semibold shadow-sm transition hover:bg-slate-50 active:translate-y-px dark:hover:bg-slate-900/30 ${
                  it.id === starred.currentSearch
                    ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
                    : "border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100"
                }`}
                title={new Date(it.createdAt).toLocaleString()}
              >
                {it.ruleDecimal}
              </a>
            ))}
          </div>
        </details>
      ) : null}

      <div className="flex items-center">
        <button
          type="button"
          onClick={async () => {
            if (typeof window === "undefined") return;
            const text = window.location.href;
            try {
              await navigator.clipboard.writeText(text);
              setShareLabel("Link copied!");
            } catch {
              // Fallback: best-effort textarea copy.
              const ta = document.createElement("textarea");
              ta.value = text;
              ta.setAttribute("readonly", "");
              ta.style.position = "fixed";
              ta.style.left = "-9999px";
              document.body.appendChild(ta);
              ta.select();
              const ok = document.execCommand("copy");
              document.body.removeChild(ta);
              setShareLabel(ok ? "Link copied..." : "Copy failed");
            }

            if (shareLabelTimerRef.current) {
              window.clearTimeout(shareLabelTimerRef.current);
            }
            shareLabelTimerRef.current = window.setTimeout(() => {
              setShareLabel("Share this automaton");
            }, 1600);
          }}
          className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 active:translate-y-px dark:bg-sky-500 dark:hover:bg-sky-400"
        >
          {shareLabel}
        </button>
      </div>
    </div>
  );
}
