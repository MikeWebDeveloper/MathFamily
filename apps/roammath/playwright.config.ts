import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://localhost:3101" },
  webServer: {
    command: "pnpm build && pnpm start --port 3101",
    url: "http://localhost:3101",
    timeout: 180_000,
    reuseExistingServer: !process.env.CI
  }
});
