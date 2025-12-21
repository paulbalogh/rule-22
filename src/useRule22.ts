import { useCallback, useEffect, useState } from "react";

export interface UseRule22Options {
	totalItems?: number;
	initialOnes?: number;
	generations?: number;
	delay?: number;
}

function makeInitialValues(
	totalItems: number,
	initialOnes: number,
): Array<0 | 1> {
	const n = Math.max(0, Math.min(totalItems, Math.floor(initialOnes)));
	const values = Array.from({ length: totalItems }, () => 0 as 0 | 1);
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

export function useRule22({
	totalItems = 100,
	initialOnes = 1,
	generations = 100,
	delay = 100,
}: UseRule22Options = {}) {
	const [state, setState] = useState(() => {
		const blocks = makeInitialValues(totalItems, initialOnes);
		return {
			blocks,
			generation: 0,
			isRunning: false,
			onesHistory: [countOnes(blocks)],
		};
	});

	// If config changes, re-seed on the next tick (keeps the "no setState in effect body" lint happy).
	useEffect(() => {
		const t = setTimeout(() => {
			const blocks = makeInitialValues(totalItems, initialOnes);
			setState({
				blocks,
				generation: 0,
				isRunning: false,
				onesHistory: [countOnes(blocks)],
			});
		}, 0);
		return () => clearTimeout(t);
	}, [totalItems, initialOnes]);

	useEffect(() => {
		if (!state.isRunning) return;
		const interval = setInterval(() => {
			setState((prev) => {
				const nextBlocks = Array.from(
					{ length: prev.blocks.length },
					(_, i) => {
						const left = i > 0 ? prev.blocks[i - 1] : 0;
						const current = prev.blocks[i] ?? 0;
						const right = i < prev.blocks.length - 1 ? prev.blocks[i + 1] : 0;
						return (left + current + right === 1 ? 1 : 0) as 0 | 1;
					},
				);

				const nextGeneration = prev.generation + 1;
				const nextHistory = prev.onesHistory.slice(0, prev.generation + 1);
				nextHistory[nextGeneration] = countOnes(nextBlocks);

				return {
					blocks: nextBlocks,
					generation: nextGeneration,
					isRunning: nextGeneration >= generations ? false : prev.isRunning,
					onesHistory: nextHistory,
				};
			});
		}, delay);
		return () => clearInterval(interval);
	}, [delay, generations, state.isRunning]);

	const start = useCallback(() => {
		setState((prev) => ({
			...prev,
			isRunning: true,
			generation: 0,
			onesHistory: [countOnes(prev.blocks)],
		}));
	}, []);

	const stop = useCallback(() => {
		setState((prev) => ({ ...prev, isRunning: false }));
	}, []);

	const reset = useCallback(() => {
		const blocks = makeInitialValues(totalItems, initialOnes);
		setState({
			blocks,
			generation: 0,
			isRunning: false,
			onesHistory: [countOnes(blocks)],
		});
	}, [initialOnes, totalItems]);

	return {
		blocks: state.blocks,
		generation: state.generation,
		isRunning: state.isRunning,
		onesHistory: state.onesHistory,
		start,
		stop,
		reset,
	};
}
