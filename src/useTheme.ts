import { useEffect, useMemo, useState } from "react";
import {
	applyThemeClass,
	getStoredThemeSetting,
	type ResolvedTheme,
	resolveTheme,
	setStoredThemeSetting,
	type ThemeSetting,
} from "./theme";

export function useTheme() {
	const [setting, setSetting] = useState<ThemeSetting>(() => {
		if (typeof window === "undefined") return "system";
		return getStoredThemeSetting();
	});

	const resolved = useMemo<ResolvedTheme>(
		() => resolveTheme(setting),
		[setting],
	);

	useEffect(() => {
		applyThemeClass(resolved);
	}, [resolved]);

	useEffect(() => {
		if (typeof window === "undefined") return;
		setStoredThemeSetting(setting);
	}, [setting]);

	useEffect(() => {
		if (typeof window === "undefined") return;
		if (!window.matchMedia) return;

		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = () => {
			if (setting !== "system") return;
			applyThemeClass(resolveTheme("system"));
		};

		// Prefer the modern event API.
		if (typeof media.addEventListener === "function") {
			media.addEventListener("change", onChange);
			return () => media.removeEventListener("change", onChange);
		}

		// Fallback without using deprecated addListener/removeListener.
		const handler = () => onChange();
		const previous = media.onchange;
		media.onchange = handler;
		return () => {
			if (media.onchange === handler) media.onchange = previous ?? null;
		};
	}, [setting]);

	const toggle = () =>
		setSetting((s) => (resolveTheme(s) === "dark" ? "light" : "dark"));

	return { setting, setSetting, resolved, toggle };
}
