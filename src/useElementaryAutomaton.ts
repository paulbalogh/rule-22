import { useCallback, useEffect, useState } from "react";

export interface UseElementaryAutomatonOptions {
	ruleDecimal: number; // 0..255
	totalItems?: number;
	initialOnes?: number;
	generations?: number;
	delay?: number;
	boundaryValue?: 0 | 1;
}

function makeInitialValues(
	totalItems: number,
	initialOnes: number,
	boundaryValue?: 0 | 1,
): Array<0 | 1> {
	const n = Math.max(0, Math.min(totalItems, Math.floor(initialOnes)));
	const values = Array.from(
		{ length: totalItems },
		() => boundaryValue ?? (0 as 0 | 1),
	);
	if (n === 0 || totalItems === 0) return values;

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
	generations = 100,
	delay = 10,
	boundaryValue = 0,
}: UseElementaryAutomatonOptions) {
	const rule = clampRuleDecimal(ruleDecimal);

	const [state, setState] = useState(() => {
		const blocks = makeInitialValues(totalItems, initialOnes, boundaryValue);
		return {
			blocks,
			generation: 0,
			isRunning: false,
			onesHistory: [countOnes(blocks)],
			blocksHistory: [{ generation: 0, blocks }],
		};
	});

	// If config changes, re-seed on the next tick (keeps the "no setState in effect body" lint happy).
	useEffect(() => {
		const t = setTimeout(() => {
			const blocks = makeInitialValues(totalItems, initialOnes, boundaryValue);
			setState({
				blocks,
				generation: 0,
				isRunning: false,
				onesHistory: [countOnes(blocks)],
				blocksHistory: [{ generation: 0, blocks }],
			});
		}, 0);
		return () => clearTimeout(t);
	}, [totalItems, initialOnes, boundaryValue]);

	useEffect(() => {
		if (!state.isRunning) return;
		const interval = setInterval(() => {
			setState((prev) => {
				const nextBlocks = Array.from(
					{ length: prev.blocks.length },
					(_, i) => {
						const left = i > 0 ? prev.blocks[i - 1] : boundaryValue;
						const current = prev.blocks[i] ?? boundaryValue;
						const right =
							i < prev.blocks.length - 1 ? prev.blocks[i + 1] : boundaryValue;

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
		setState((prev) => ({
			...prev,
			isRunning: true,
			generation: 0,
			onesHistory: [countOnes(prev.blocks)],
			blocksHistory: [{ generation: 0, blocks: prev.blocks }],
		}));
	}, []);

	const stop = useCallback(() => {
		setState((prev) => ({ ...prev, isRunning: false }));
	}, []);

	const reset = useCallback(() => {
		const blocks = makeInitialValues(totalItems, initialOnes, boundaryValue);
		setState({
			blocks,
			generation: 0,
			isRunning: false,
			onesHistory: [countOnes(blocks)],
			blocksHistory: [{ generation: 0, blocks }],
		});
	}, [initialOnes, totalItems, boundaryValue]);

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
