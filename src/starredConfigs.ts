import type { ShareableAutomatonState } from "./urlState";
import {
	buildShareableSearch,
	parseShareableStateFromLocation,
} from "./urlState";

export type StarredConfig = {
	/** Stable unique id for this config. We use the shareable search string. */
	id: string;
	/** The shareable `?....` string. */
	search: string;
	/** Convenience for UI. */
	ruleDecimal: number;
	createdAt: number;
};

const STORAGE_KEY = "rule22.starredConfigs.v1";
const MAX_ITEMS = 50;

function safeJsonParse(raw: string | null): unknown {
	if (raw == null) return null;
	try {
		return JSON.parse(raw) as unknown;
	} catch {
		return null;
	}
}

function isStarredConfig(value: unknown): value is StarredConfig {
	if (!value || typeof value !== "object") return false;
	const v = value as Partial<StarredConfig>;
	return (
		typeof v.id === "string" &&
		typeof v.search === "string" &&
		typeof v.ruleDecimal === "number" &&
		Number.isFinite(v.ruleDecimal) &&
		typeof v.createdAt === "number" &&
		Number.isFinite(v.createdAt)
	);
}

function normalizeSearch(search: string): string {
	if (!search) return "";
	return search.startsWith("?") ? search : `?${search}`;
}

export function makeStarredFromState(
	state: ShareableAutomatonState,
	now = Date.now(),
): StarredConfig {
	const search = buildShareableSearch(state);
	const id = search;
	return { id, search, ruleDecimal: state.ruleDecimal, createdAt: now };
}

export function loadStarredConfigs(): StarredConfig[] {
	if (typeof window === "undefined") return [];
	const raw = window.localStorage.getItem(STORAGE_KEY);
	const parsed = safeJsonParse(raw);
	if (!Array.isArray(parsed)) return [];
	const items = parsed.filter(isStarredConfig);
	// Normalize + de-dupe by id, keep newest first.
	const seen = new Set<string>();
	const out: StarredConfig[] = [];
	for (const item of items) {
		const search = normalizeSearch(item.search);
		const id = search;
		if (!id) continue;
		if (seen.has(id)) continue;
		seen.add(id);
		out.push({ ...item, search, id });
	}
	out.sort((a, b) => b.createdAt - a.createdAt);
	return out.slice(0, MAX_ITEMS);
}

export function saveStarredConfigs(items: StarredConfig[]) {
	if (typeof window === "undefined") return;
	const trimmed = items
		.filter((i) => i && typeof i.id === "string" && i.id.length > 0)
		.slice(0, MAX_ITEMS);
	window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function isConfigStarred(
	items: StarredConfig[],
	search: string,
): boolean {
	const id = normalizeSearch(search);
	return items.some((i) => i.id === id);
}

export function addConfigStar(
	items: StarredConfig[],
	starred: StarredConfig,
): StarredConfig[] {
	const id = normalizeSearch(starred.id);
	if (!id) return items;

	const without = items.filter((i) => i.id !== id);
	const next = [
		{ ...starred, id, search: normalizeSearch(starred.search) },
		...without,
	];
	next.sort((a, b) => b.createdAt - a.createdAt);
	return next.slice(0, MAX_ITEMS);
}

export function removeConfigStar(
	items: StarredConfig[],
	search: string,
): StarredConfig[] {
	const id = normalizeSearch(search);
	return items.filter((i) => i.id !== id);
}

export function toggleConfigStar(
	items: StarredConfig[],
	state: ShareableAutomatonState,
	now = Date.now(),
): StarredConfig[] {
	const starred = makeStarredFromState(state, now);
	if (isConfigStarred(items, starred.search)) {
		return removeConfigStar(items, starred.search);
	}
	return addConfigStar(items, starred);
}

export function parseStarredToState(
	search: string,
): Partial<ShareableAutomatonState> {
	// We reuse the existing URL parser (expects a `.search` string like "?r=...").
	return parseShareableStateFromLocation({ search: normalizeSearch(search) });
}
