import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 8000 },
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    launchOptions: {
      ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
        ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
        : {}),
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--host-resolver-rules=MAP public-http.test 127.0.0.1',
        '--no-proxy-server',
      ],
    },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'mobile-chrome', use: { ...devices['Pixel 7'] } }],
  webServer: [
    {
      command: 'node --import tsx tests/e2e/server.ts',
      url: 'http://127.0.0.1:3000/api/health',
      reuseExistingServer: !process.env.CI,
      env: {
        AI_ALLOWED_HOSTS: '127.0.0.1',
        DATABASE_PATH: process.env.E2E_DATABASE_PATH || 'data/e2e-admin.sqlite',
        UPLOADS_PATH: process.env.E2E_UPLOADS_PATH || 'data/e2e-admin-media',
        ALLOWED_ORIGINS: 'http://127.0.0.1:5173,http://localhost:5173,https://localhost',
        MEDIA_SIGNING_SECRET: 'test-key-for-ci-not-for-production-use',
      },
    },
    {
      command: 'npm run dev -w apps/client -- --host 127.0.0.1',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
