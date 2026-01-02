import { test, expect } from '@playwright/test';

// some general tests

test.describe('Dark mode', { tag: '@neo4j-read' }, () => {
    test.use({
        colorScheme: 'dark',
        viewport: { width: 1280, height: 800 },
    });

    test('Load page', async ({ page }) => {
        await page.goto(process.env.URL || '/');
        await expect(page).toHaveScreenshot();
        await page.getByTitle('Dark mode switch').click();
        await expect(page).toHaveScreenshot();
    });
});

test.describe('Remember me', { tag: '@neo4j-read' }, () => {
    test('Turn it on and check', async ({ page }) => {
        // open page and login
        await page.goto(process.env.URL || '/');
        await page.getByLabel('URL').fill(process.env.DB_HOSTNAME || 'bolt://localhost:7687');
        await page.getByLabel('Username').fill(process.env.DB_USERNAME || '');
        await page.getByLabel('Password').fill(process.env.DB_PASSWORD || '');
        await page.getByText('Remember me (not secure)').click();
        await page.getByRole('button', { name: 'Login' }).click();
        // check success
        await expect(page.getByLabel('main navigation')).toHaveCount(1);
        // open page again and it should automatically log in
        await page.goto(process.env.URL || '/');
        await expect(page.getByLabel('main navigation')).toHaveCount(1);
        // click on log out button should stay at login page
        await page.getByRole('button', { name: 'Log out' }).click();
        await expect(page.locator('form#login')).toHaveCount(1);
    });
});
