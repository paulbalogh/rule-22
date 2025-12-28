export type ShareableAutomatonState = {
	ruleDecimal: number; // 0..255
	totalItems: number; // 1..300
	generations: number; // 1..500
	delay: number; // 10..5000
	seedIndices: number[]; // unique indices in [0..totalItems-1]
};

function clampInt(value: number, min: number, max: number) {
	const v = Number.isFinite(value) ? Math.floor(value) : min;
	return Math.max(min, Math.min(max, v));
}

function parseIntParam(params: URLSearchParams, key: string, fallback: number) {
	const raw = params.get(key);
	if (raw == null) return fallback;
	const n = Number(raw);
	return Number.isFinite(n) ? Math.floor(n) : fallback;
}

function uniqSortedIndices(indices: number[], totalItems: number): number[] {
	const set = new Set<number>();
	for (const idx of indices) {
		if (!Number.isFinite(idx)) continue;
		const i = Math.floor(idx);
		if (i < 0 || i >= totalItems) continue;
		set.add(i);
	}
	return Array.from(set).sort((a, b) => a - b);
}

// Base64url helpers (no padding)
function base64UrlEncode(bytes: Uint8Array): string {
	let bin = "";
	for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
	const b64 = btoa(bin);
	return b64.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlDecode(s: string): Uint8Array | null {
	try {
		const b64 = s.replaceAll("-", "+").replaceAll("_", "/");
		const padLen = (4 - (b64.length % 4)) % 4;
		const padded = b64 + "=".repeat(padLen);
		const bin = atob(padded);
		const bytes = new Uint8Array(bin.length);
		for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
		return bytes;
	} catch {
		return null;
	}
}

export function encodeSeedBitset(totalItems: number, seedIndices: number[]) {
	const safeTotal = clampInt(totalItems, 1, 300);
	const indices = uniqSortedIndices(seedIndices, safeTotal);

	const byteLen = Math.ceil(safeTotal / 8);
	const bytes = new Uint8Array(byteLen);
	for (const idx of indices) {
		const byteIndex = Math.floor(idx / 8);
		const bitInByte = idx % 8;
		// MSB-first within byte: idx 0 -> bit 7, idx 7 -> bit 0
		bytes[byteIndex] |= 1 << (7 - bitInByte);
	}
	return base64UrlEncode(bytes);
}

export function decodeSeedBitset(
	totalItems: number,
	encoded: string,
): number[] | null {
	const safeTotal = clampInt(totalItems, 1, 300);
	const bytes = base64UrlDecode(encoded);
	if (!bytes) return null;

	const out: number[] = [];
	for (let idx = 0; idx < safeTotal; idx++) {
		const byteIndex = Math.floor(idx / 8);
		const bitInByte = idx % 8;
		const b = bytes[byteIndex] ?? 0;
		const bit = (b >> (7 - bitInByte)) & 1;
		if (bit === 1) out.push(idx);
	}
	return out;
}

export function parseShareableStateFromLocation(
	locationLike: Pick<Location, "search">,
): Partial<ShareableAutomatonState> {
	const params = new URLSearchParams(locationLike.search);

	const ruleDecimal = clampInt(parseIntParam(params, "r", 22), 0, 255);
	const totalItems = clampInt(parseIntParam(params, "w", 118), 1, 300);
	const generations = clampInt(parseIntParam(params, "g", 100), 1, 500);
	const delay = clampInt(parseIntParam(params, "d", 10), 10, 5_000);

	const seedEncoded = params.get("s");
	const seedIndices =
		seedEncoded != null ? decodeSeedBitset(totalItems, seedEncoded) : null;

	return {
		ruleDecimal,
		totalItems,
		generations,
		delay,
		...(seedIndices ? { seedIndices } : {}),
	};
}

export function buildShareableSearch(state: ShareableAutomatonState): string {
	const params = new URLSearchParams();
	params.set("r", String(clampInt(state.ruleDecimal, 0, 255)));
	params.set("w", String(clampInt(state.totalItems, 1, 300)));
	params.set("g", String(clampInt(state.generations, 1, 500)));
	params.set("d", String(clampInt(state.delay, 10, 5_000)));
	params.set("s", encodeSeedBitset(state.totalItems, state.seedIndices));
	const s = params.toString();
	return s.length ? `?${s}` : "";
}
