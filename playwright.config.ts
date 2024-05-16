import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: './e2e',
    /* Custom path and filename for snapshots */
    snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}{ext}',
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Don't retry */
    retries: process.env.CI ? 2 : 0,
    /* Allow parallel */
    workers: process.env.CI ? 1 : undefined,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: [process.env.CI ? ['github'] : ['html', { open: 'never' }]],
    /* Set reporting slow tests */
    reportSlowTests: {
        max: 5,
        threshold: 60000,
    },
    /* Limit the number of failures on CI to save resources */
    maxFailures: process.env.CI ? 5 : 0,
    timeout: 120000,
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: 'http://127.0.0.1:3000',
        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'retain-on-failure',
    },
    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                viewport: {
                    height: 1800,
                    width: 1280,
                },
                permissions: ['clipboard-read', 'clipboard-write'],
            },
        },
    ],
    /* Run your local dev server before starting the tests */
    webServer: {
        command: 'npm run start',
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: !process.env.CI,
    },
    expect: {
        /* Timeout for each assertion */
        timeout: 30000,
        toHaveScreenshot: { maxDiffPixelRatio: 0.05 },
    },
});
