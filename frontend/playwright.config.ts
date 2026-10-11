import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: { timeout: 20000 },
  fullyParallel: false,
  workers: 1,
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3100', headless: true },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : { command: 'node tests/static-server.cjs', url: 'http://127.0.0.1:3100/fr/', reuseExistingServer: false },
});
