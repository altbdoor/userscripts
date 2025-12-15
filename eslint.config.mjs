import { defineConfig, globalIgnores } from "eslint/config";
import { configs, rules } from "eslint-plugin-userscripts";

export default defineConfig([
  globalIgnores(["archive/"]),
  {
    files: ["*.user.js"],
    plugins: {
      userscripts: { rules },
    },
    rules: {
      ...configs.recommended.rules,
      "userscripts/require-description": ["warn"],
    },
    settings: {
      userscriptVersions: { violentmonkey: ">=2.30.0" },
    },
  },
]);
