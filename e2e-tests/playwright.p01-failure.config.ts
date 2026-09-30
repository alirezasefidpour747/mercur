import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./p01",
  testMatch: "failure-states.spec.ts",
  workers: 1,
  fullyParallel: false,
  timeout: 60000,
  reporter: [["list"]],
  use: {
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    launchOptions: {
      ...(process.env.P01_CHROME_PATH
        ? { executablePath: process.env.P01_CHROME_PATH }
        : {}),
      args: ["--no-sandbox"],
    },
  },
  webServer: [
    {
      command: "bunx next dev --hostname 127.0.0.1 --port 3011",
      cwd: "../apps/storefront",
      url: "http://127.0.0.1:3011/fa/login",
      timeout: 120000,
      reuseExistingServer: false,
      env: { MEDUSA_BACKEND_URL: "http://127.0.0.1:9019" },
    },
    {
      command: "bunx vite --host 127.0.0.1 --port 7011",
      cwd: "../apps/admin-test",
      url: "http://127.0.0.1:7011",
      timeout: 120000,
      reuseExistingServer: false,
      env: { VITE_MERCUR_BACKEND_URL: "http://127.0.0.1:9019" },
    },
    {
      command: "bunx vite --host 127.0.0.1 --port 7012",
      cwd: "../apps/vendor",
      url: "http://127.0.0.1:7012",
      timeout: 120000,
      reuseExistingServer: false,
      env: { VITE_MERCUR_BACKEND_URL: "http://127.0.0.1:9019" },
    },
  ],
});
