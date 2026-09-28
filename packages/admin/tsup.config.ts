import { defineConfig } from "tsup";

export default defineConfig({
  // Cleaning from tsup can race with its DTS/ESM tasks (or a previously
  // running watch process) and try to unlink the same stale chunk twice.
  // package.json performs one atomic, force-safe pre-clean instead.
  clean: false,
  dts: true,
  entry: ["src/index.ts", "src/index.css", 'src/pages/index.ts'],
  format: ["esm"],
  external: ["react", "react-dom", "react-router-dom", "virtual:mercur/config", "virtual:mercur/routes", "virtual:mercur/menu-items", "virtual:mercur/i18n", "virtual:mercur/widgets", "virtual:mercur/navigation", "virtual:mercur/custom-fields"],
});
