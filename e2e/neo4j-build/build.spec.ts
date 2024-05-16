import { expect, test } from '@playwright/test';

test.describe('Access cypherGUI as file', { tag: '@build' }, () => {
    test('Open and login', async ({ page }) => {
        await page.goto('file://' + require('node:path').resolve('./build/index.html'));
        await page.getByLabel('URL').fill(process.env.DB_HOSTNAME || 'bolt://localhost:7687');
        await page.getByLabel('Username').fill(process.env.DB_USERNAME);
        await page.getByLabel('Password').fill(process.env.DB_PASSWORD);
        await page.getByRole('button', { name: 'Login' }).click();
        await expect(page.locator('#basicNavbar')).toBeVisible();
    });
});
