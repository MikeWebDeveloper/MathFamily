import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://localhost:3100" },
  webServer: {
    // Use `next build` directly, NOT `pnpm build` — the build script appends
    // `node indexnow.mjs`, which pings the live IndexNow API. e2e must not do that.
    command: "pnpm exec next build && pnpm start --port 3100",
    url: "http://localhost:3100",
    timeout: 180_000,
    reuseExistingServer: !process.env.CI
  }
});
