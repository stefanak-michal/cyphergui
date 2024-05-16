import { expect, test as base } from '@playwright/test';

export const test = base.extend({
    page: async ({ page }, use) => {
        await page.goto(process.env.URL || '/');
        await page.getByLabel('URL').fill(process.env.DB_HOSTNAME || 'bolt://localhost:7687');
        await page.getByLabel('Username').fill(process.env.DB_USERNAME || '');
        await page.getByLabel('Password').fill(process.env.DB_PASSWORD || '');
        await page.getByRole('button', { name: 'Login' }).click();
        await expect(page.locator('#basicNavbar')).toBeVisible();

        await use(page);
    },
});

export { expect };
