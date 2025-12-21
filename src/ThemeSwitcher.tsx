/**
 * ThemeSwitcher
 *
 * A component that allows the user to switch between light, dark mode and system mode using the useTheme hook.
 * Uses icons from @tabler/icons-react.
 *
 * @returns A button that allows the user to switch between light, dark mode and system mode.
 */

import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react";
import { useTheme } from "./useTheme";

export function ThemeSwitcher() {
  const { setting, setSetting, resolved } = useTheme();

  const base =
    "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 p-1 text-slate-700 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200";

  const itemBase =
    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600";

  const itemActive =
    "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900";

  const itemInactive =
    "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-900/60 dark:hover:text-slate-100";

  const iconClass = "h-4 w-4";

  return (
    <fieldset className={base}>
      <legend className="sr-only">Theme</legend>

      <button
        type="button"
        className={`${itemBase} ${
          setting === "system" ? itemActive : itemInactive
        }`}
        aria-pressed={setting === "system"}
        onClick={() => setSetting("system")}
        title={`System (${resolved})`}
      >
        <IconDeviceDesktop className={iconClass} aria-hidden="true" />
        {/* System */}
      </button>

      <button
        type="button"
        className={`${itemBase} ${
          setting === "light" ? itemActive : itemInactive
        }`}
        aria-pressed={setting === "light"}
        onClick={() => setSetting("light")}
        title="Light"
      >
        <IconSun className={iconClass} aria-hidden="true" />
        {/* Light */}
      </button>

      <button
        type="button"
        className={`${itemBase} ${
          setting === "dark" ? itemActive : itemInactive
        }`}
        aria-pressed={setting === "dark"}
        onClick={() => setSetting("dark")}
        title="Dark"
      >
        <IconMoon className={iconClass} aria-hidden="true" />
        {/* Dark */}
      </button>
    </fieldset>
  );
}
