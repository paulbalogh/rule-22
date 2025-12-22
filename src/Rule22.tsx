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

import { useEffect, useMemo, useRef, useState } from "react";
import { to8BitBinary } from "./rules";
import { useElementaryAutomaton } from "./useElementaryAutomaton";

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

export function Rule22({
  totalItems = 100,
  initialOnes = 1,
  generations = 100,
  delay = 100,
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
  const [draft, setDraft] = useState(() => ({
    ruleDecimal: 22,
    totalItems,
    initialOnes,
    generations,
    delay,
  }));

  const [config, setConfig] = useState(() => ({
    ruleDecimal: 22,
    totalItems,
    initialOnes,
    generations,
    delay,
  }));

  const applied = useMemo(() => {
    const safeRuleDecimal = clampInt(config.ruleDecimal, 0, 255);
    const safeTotal = clampInt(config.totalItems, 1, 300);
    const safeInitial = clampInt(config.initialOnes, 0, safeTotal);
    const safeGenerations = clampInt(config.generations, 1, 500);
    const safeDelay = clampInt(config.delay, 10, 5_000);
    return {
      ruleDecimal: safeRuleDecimal,
      totalItems: safeTotal,
      initialOnes: safeInitial,
      generations: safeGenerations,
      delay: safeDelay,
    };
  }, [
    config.delay,
    config.generations,
    config.initialOnes,
    config.ruleDecimal,
    config.totalItems,
  ]);

  const ruleMeta = useMemo(
    () => ({
      name: `Rule ${applied.ruleDecimal}`,
      decimal: applied.ruleDecimal,
      binary: to8BitBinary(applied.ruleDecimal),
    }),
    [applied.ruleDecimal]
  );

  const { blocks, generation, isRunning, onesHistory, start, stop, reset } =
    useElementaryAutomaton(applied);

  const canStart = !isRunning && generation < applied.generations;
  const canStop = isRunning;
  const canToggleRun = isRunning ? canStop : canStart;

  const cols = Math.min(10, Math.max(1, applied.totalItems));
  const cellIds = useMemo(
    () => Array.from({ length: applied.totalItems }, (_, i) => `cell-${i}`),
    [applied.totalItems]
  );

  const chart = useMemo(() => {
    const history = onesHistory.slice(
      0,
      Math.min(onesHistory.length, generation + 1)
    );
    const max = Math.max(1, ...history);
    return { history, max };
  }, [generation, onesHistory]);

  const bars = useMemo(
    () =>
      chart.history.map((count, gen) => ({
        id: `gen-${gen}`,
        gen,
        count,
      })),
    [chart.history]
  );

  const chartScrollRef = useRef<HTMLDivElement | null>(null);
  const prevBarsLenRef = useRef(0);

  useEffect(() => {
    if (bars.length > prevBarsLenRef.current) {
      const el = chartScrollRef.current;
      if (el) {
        requestAnimationFrame(() => {
          el.scrollLeft = el.scrollWidth;
        });
      }
    }
    prevBarsLenRef.current = bars.length;
  }, [bars.length]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Cellular automaton
          </div>
          <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
            {ruleMeta.name} • decimal {ruleMeta.decimal} • binary{" "}
            <span className="font-mono">{ruleMeta.binary}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
              isRunning
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200"
                : "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200"
            }`}
          >
            {isRunning ? "Running" : "Paused"}
          </span>
        </div>
      </div>

      <fieldset className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/30">
        <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          Rule & Run
        </legend>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="flex w-full flex-col gap-1 sm:max-w-60">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
              Rule
            </span>
            <select
              value={draft.ruleDecimal}
              onChange={(e) => {
                const nextRule = clampInt(Number(e.target.value), 0, 255);
                setDraft((d) => ({ ...d, ruleDecimal: nextRule }));
                setConfig((c) => ({ ...c, ruleDecimal: nextRule }));
                stop();
                reset();
              }}
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
              onClick={isRunning ? stop : start}
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
              onClick={() => {
                stop();
                reset();
              }}
              className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 active:translate-y-px sm:flex-none dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 dark:hover:bg-slate-900/30"
            >
              Reset
            </button>
          </div>
        </div>
      </fieldset>

      <details className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/30">
        <summary className="cursor-pointer list-none select-none px-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          Controls
        </summary>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
              Total items
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={300}
              value={draft.totalItems}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  totalItems: Number(e.target.value),
                }))
              }
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-slate-400 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 dark:focus-visible:ring-slate-600"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
              Initial ones
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={Math.max(0, draft.totalItems)}
              value={draft.initialOnes}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  initialOnes: Number(e.target.value),
                }))
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
                setDraft((d) => ({
                  ...d,
                  generations: Number(e.target.value),
                }))
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
              onChange={(e) =>
                setDraft((d) => ({ ...d, delay: Number(e.target.value) }))
              }
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-slate-400 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 dark:focus-visible:ring-slate-600"
            />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-600 dark:text-slate-300">
            Generation{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {generation}
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
            <button
              type="button"
              onClick={() => {
                // Apply with clamping to avoid surprising resets while typing.
                const safeTotal = clampInt(draft.totalItems, 1, 300);
                const safeInitial = clampInt(draft.initialOnes, 0, safeTotal);
                const safeGenerations = clampInt(draft.generations, 1, 500);
                const safeDelay = clampInt(draft.delay, 10, 5_000);
                setDraft((d) => ({
                  ...d,
                  totalItems: safeTotal,
                  initialOnes: safeInitial,
                  generations: safeGenerations,
                  delay: safeDelay,
                }));
                setConfig((c) => ({
                  ...c,
                  totalItems: safeTotal,
                  initialOnes: safeInitial,
                  generations: safeGenerations,
                  delay: safeDelay,
                }));
              }}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 dark:hover:bg-slate-900/30"
            >
              Apply
            </button>
          </div>
        </div>
      </details>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/30">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            Ones per generation
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {chart.history.length === 0 ? "—" : `max ${chart.max}`}
          </div>
        </div>

        <div className="mt-3">
          {chart.history.length === 0 ? (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Start the simulation to populate the chart.
            </div>
          ) : (
            <div ref={chartScrollRef} className="overflow-x-auto">
              <div className="flex items-end gap-1 pb-1">
                {bars.map(({ id, gen, count }) => (
                  <div
                    key={id}
                    className="flex w-3 flex-col items-center gap-1"
                  >
                    <div className="flex h-14 items-end">
                      <div
                        className={`w-2 rounded-sm ${
                          gen === generation
                            ? "bg-slate-900 dark:bg-slate-100"
                            : "bg-slate-300 dark:bg-slate-700"
                        }`}
                        style={{
                          height: `${Math.max(2, (count / chart.max) * 100)}%`,
                        }}
                        title={`Gen ${gen}: ${count} ones`}
                      />
                    </div>
                    <div className="text-[10px] font-medium leading-none text-slate-500 dark:text-slate-400">
                      {count}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/30">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            Grid
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            10 per row
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center">
          <div
            className="grid gap-2"
            aria-hidden="true"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            }}
          >
            {cellIds.map((id, i) => {
              const block = blocks[i] ?? 0;
              return (
                <div
                  key={id}
                  className={`h-4 w-4 rounded-lg ring-1 transition-colors duration-200 ${
                    block === 1
                      ? "bg-blue-600 ring-blue-700/30 dark:bg-sky-400 dark:ring-sky-300/30"
                      : "bg-slate-200 ring-slate-300 dark:bg-slate-800 dark:ring-slate-700"
                  }`}
                  title={block === 1 ? "On" : "Off"}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
