import { useCallback, useEffect, useRef, useState } from "react";

export interface UseElementaryAutomatonOptions {
	ruleDecimal: number; // 0..255
	totalItems?: number;
	initialOnes?: number;
	seedIndices?: number[];
	generations?: number;
	delay?: number;
	boundaryValue?: 0 | 1;
}

function makeInitialValues(
	totalItems: number,
	initialOnes: number,
	boundaryValue?: 0 | 1,
	seedIndices?: number[],
): Array<0 | 1> {
	const n = Math.max(0, Math.min(totalItems, Math.floor(initialOnes)));
	const values = Array.from(
		{ length: totalItems },
		() => boundaryValue ?? (0 as 0 | 1),
	);
	if (totalItems === 0) return values;

	if (Array.isArray(seedIndices) && seedIndices.length > 0) {
		const set = new Set<number>();
		for (const idx of seedIndices) {
			if (!Number.isFinite(idx)) continue;
			const i = Math.floor(idx);
			if (i < 0 || i >= totalItems) continue;
			set.add(i);
		}
		for (const i of set) values[i] = 1;
		return values;
	}

	if (n === 0) return values;

	// Pick n unique indices uniformly.
	const indices = Array.from({ length: totalItems }, (_, i) => i);
	for (let i = indices.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[indices[i], indices[j]] = [indices[j], indices[i]];
	}
	for (let k = 0; k < n; k++) values[indices[k]] = 1;
	return values;
}

function countOnes(values: Array<0 | 1>): number {
	return values.reduce<number>((acc, b) => acc + b, 0);
}

function clampRuleDecimal(ruleDecimal: number): number {
	if (!Number.isFinite(ruleDecimal)) return 0;
	return Math.max(0, Math.min(255, Math.floor(ruleDecimal)));
}

/**
 * Elementary Cellular Automaton rule application.
 * Neighborhood index: (L,C,R) as a 3-bit number in the order L C R, so:
 * 000 -> 0 ... 111 -> 7.
 * Output bit is taken from ruleDecimal at that index.
 */
function applyElementaryRule(
	ruleDecimal: number,
	left: 0 | 1,
	current: 0 | 1,
	right: 0 | 1,
): 0 | 1 {
	const idx = (left << 2) | (current << 1) | right; // 0..7
	return ((ruleDecimal >> idx) & 1) as 0 | 1;
}

export function useElementaryAutomaton({
	ruleDecimal,
	totalItems = 118,
	initialOnes = 1,
	seedIndices,
	generations = 100,
	delay = 10,
	boundaryValue = 0,
}: UseElementaryAutomatonOptions) {
	const rule = clampRuleDecimal(ruleDecimal);

	const [state, setState] = useState(() => {
		const blocks = makeInitialValues(
			totalItems,
			initialOnes,
			boundaryValue,
			seedIndices,
		);
		return {
			blocks,
			generation: 0,
			isRunning: false,
			onesHistory: [countOnes(blocks)],
			blocksHistory: [{ generation: 0, blocks }],
		};
	});

	// If config changes, re-seed on the next tick (keeps the "no setState in effect body" lint happy).
	const didMountRef = useRef(false);
	const prevConfigKeyRef = useRef<string | null>(null);
	useEffect(() => {
		const seedKey = Array.isArray(seedIndices) ? seedIndices.join(",") : "";

		// Don't re-seed on first mount; the initial useState initializer already did it.
		if (!didMountRef.current) {
			didMountRef.current = true;
			prevConfigKeyRef.current = `${totalItems}|${initialOnes}|${boundaryValue}|${seedKey}`;
			return;
		}

		const nextKey = `${totalItems}|${initialOnes}|${boundaryValue}|${seedKey}`;
		if (prevConfigKeyRef.current === nextKey) return;
		prevConfigKeyRef.current = nextKey;

		const t = setTimeout(() => {
			const blocks = makeInitialValues(
				totalItems,
				initialOnes,
				boundaryValue,
				seedIndices,
			);
			setState({
				blocks,
				generation: 0,
				isRunning: false,
				onesHistory: [countOnes(blocks)],
				blocksHistory: [{ generation: 0, blocks }],
			});
		}, 0);
		return () => clearTimeout(t);
	}, [totalItems, initialOnes, boundaryValue, seedIndices]);

	useEffect(() => {
		if (!state.isRunning) return;
		const interval = setInterval(() => {
			setState((prev) => {
				const nextBlocks = Array.from(
					{ length: prev.blocks.length },
					(_, i) => {
						const n = prev.blocks.length;
						if (n === 0) return boundaryValue;

						// "Stitched" boundary: treat the row as a ring (wrap-around).
						const left = prev.blocks[(i - 1 + n) % n] ?? boundaryValue;
						const current = prev.blocks[i] ?? boundaryValue;
						const right = prev.blocks[(i + 1) % n] ?? boundaryValue;

						return applyElementaryRule(rule, left, current, right);
					},
				);

				const nextGeneration = prev.generation + 1;
				const nextHistory = prev.onesHistory.slice(0, prev.generation + 1);
				nextHistory[nextGeneration] = countOnes(nextBlocks);

				const nextBlocksHistory = prev.blocksHistory.slice(
					0,
					prev.generation + 1,
				);
				nextBlocksHistory[nextGeneration] = {
					generation: nextGeneration,
					blocks: nextBlocks,
				};

				return {
					blocks: nextBlocks,
					generation: nextGeneration,
					isRunning: nextGeneration >= generations ? false : prev.isRunning,
					onesHistory: nextHistory,
					blocksHistory: nextBlocksHistory,
				};
			});
		}, delay);
		return () => clearInterval(interval);
	}, [delay, generations, state.isRunning, rule, boundaryValue]);

	const start = useCallback(() => {
		const blocks = makeInitialValues(
			totalItems,
			initialOnes,
			boundaryValue,
			seedIndices,
		);
		setState({
			blocks,
			generation: 0,
			isRunning: true,
			onesHistory: [countOnes(blocks)],
			blocksHistory: [{ generation: 0, blocks }],
		});
	}, [totalItems, initialOnes, boundaryValue, seedIndices]);

	const stop = useCallback(() => {
		setState((prev) => ({ ...prev, isRunning: false }));
	}, []);

	const reset = useCallback(() => {
		const blocks = makeInitialValues(
			totalItems,
			initialOnes,
			boundaryValue,
			seedIndices,
		);
		setState({
			blocks,
			generation: 0,
			isRunning: false,
			onesHistory: [countOnes(blocks)],
			blocksHistory: [{ generation: 0, blocks }],
		});
	}, [initialOnes, totalItems, boundaryValue, seedIndices]);

	return {
		blocks: state.blocks,
		blocksHistory: state.blocksHistory,
		generation: state.generation,
		isRunning: state.isRunning,
		onesHistory: state.onesHistory,
		start,
		stop,
		reset,
	};
}
