import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const databaseLayerMessage =
  "Only src/lib/db talks to the database, and only src/lib/auth to sign-in. Call a function from @/lib/db or @/lib/auth instead.";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-console": "error",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/db/**", "src/lib/supabase/**", "src/lib/auth/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "@supabase/supabase-js", message: databaseLayerMessage },
            { name: "@supabase/ssr", message: databaseLayerMessage },
          ],
          patterns: [{ group: ["@/lib/supabase/*"], message: databaseLayerMessage }],
        },
      ],
    },
  },
  {
    // Command-line tools report progress by printing, so the console rule is lifted for them.
    files: ["scripts/**/*.ts"],
    ignores: ["scripts/**/*.test.ts"],
    rules: { "no-console": "off" },
  },
  prettier,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "data/**"]),
]);

export default eslintConfig;
