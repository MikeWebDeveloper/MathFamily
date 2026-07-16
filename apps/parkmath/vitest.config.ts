import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

// 2026-07-12: added solely to resolve the `@/*` path alias (mirrors tsconfig.json's `"@/*": ["./*"]`)
// so tests/go-route.test.ts can import the route handler at `app/go/[airport]/[target]/route.ts`,
// which itself imports `@/lib/partners`. Every other test file in this suite uses relative imports
// only and is unaffected — this purely ADDS resolution capability, it doesn't change how any existing
// test resolves its imports. No other vitest options are set; `pnpm test` (`vitest run tests`)
// continues to run with the same defaults as before this file existed.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
