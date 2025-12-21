import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type PluginOption } from "vite";

export default defineConfig({
	appType: "spa",
	plugins: [tailwindcss() as unknown as PluginOption],
});
