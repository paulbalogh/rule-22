import { useCallback, useEffect, useMemo, useState } from "react";
import {
	addConfigStar,
	isConfigStarred,
	loadStarredConfigs,
	removeConfigStar,
	saveStarredConfigs,
	toggleConfigStar,
	type StarredConfig,
} from "./starredConfigs";
import type { ShareableAutomatonState } from "./urlState";
import { buildShareableSearch } from "./urlState";

export function useStarredConfigs(currentState: ShareableAutomatonState) {
	const [items, setItems] = useState<StarredConfig[]>(() =>
		loadStarredConfigs(),
	);

	// Keep in sync if another tab modifies storage.
	useEffect(() => {
		if (typeof window === "undefined") return;
		const onStorage = (e: StorageEvent) => {
			if (!e.key) return;
			if (e.key !== "rule22.starredConfigs.v1") return;
			setItems(loadStarredConfigs());
		};
		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, []);

	useEffect(() => {
		saveStarredConfigs(items);
	}, [items]);

	const currentSearch = useMemo(
		() =>
			buildShareableSearch({
				ruleDecimal: currentState.ruleDecimal,
				totalItems: currentState.totalItems,
				generations: currentState.generations,
				delay: currentState.delay,
				seedIndices: currentState.seedIndices,
			}),
		[
			currentState.delay,
			currentState.generations,
			currentState.ruleDecimal,
			currentState.seedIndices,
			currentState.totalItems,
		],
	);

	const isStarred = useMemo(
		() => isConfigStarred(items, currentSearch),
		[items, currentSearch],
	);

	const addCurrent = useCallback(() => {
		setItems((prev) =>
			addConfigStar(prev, {
				id: currentSearch,
				search: currentSearch,
				ruleDecimal: currentState.ruleDecimal,
				createdAt: Date.now(),
			}),
		);
	}, [currentSearch, currentState.ruleDecimal]);

	const removeCurrent = useCallback(() => {
		setItems((prev) => removeConfigStar(prev, currentSearch));
	}, [currentSearch]);

	const toggleCurrent = useCallback(() => {
		setItems((prev) => toggleConfigStar(prev, currentState));
	}, [currentState]);

	return {
		items,
		currentSearch,
		isStarred,
		addCurrent,
		removeCurrent,
		toggleCurrent,
	};
}
