import { defineConfig } from '@playwright/test';
import { createServer } from 'node:net';

let port = process.env.ROYAL_PALACE_TEST_PORT;
if (!port) {
  const reservation = createServer();
  await new Promise((resolve, reject) => {
    reservation.once('error', reject);
    reservation.listen(0, '127.0.0.1', resolve);
  });
  port = String(reservation.address().port);
  await new Promise(resolve => reservation.close(resolve));
  process.env.ROYAL_PALACE_TEST_PORT = port; // Workers must use the same server after reloading this config.
}
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/browser',
  outputDir: './output/deep-fixes/tests/browser',
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: { baseURL, browserName: 'chromium', reducedMotion: 'reduce', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', testIgnore: /navigation\.spec\.mjs/, use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'phone', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: 'node scripts/serve.mjs',
    env: { PORT: String(port) },
    url: baseURL,
    reuseExistingServer: false,
  },
});
