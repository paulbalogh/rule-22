export type ThemeSetting = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "theme";

function getSystemTheme(): ResolvedTheme {
	if (typeof window === "undefined") return "light";
	return window.matchMedia?.("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

export function resolveTheme(setting: ThemeSetting): ResolvedTheme {
	return setting === "system" ? getSystemTheme() : setting;
}

export function getStoredThemeSetting(): ThemeSetting {
	if (typeof window === "undefined") return "system";
	const stored = window.localStorage.getItem(STORAGE_KEY);
	if (stored === "light" || stored === "dark" || stored === "system") {
		return stored;
	}
	return "system";
}

export function setStoredThemeSetting(setting: ThemeSetting) {
	window.localStorage.setItem(STORAGE_KEY, setting);
}

export function applyThemeClass(resolved: ResolvedTheme) {
	document.documentElement.classList.toggle("dark", resolved === "dark");
	document.documentElement.style.colorScheme = resolved;
}
