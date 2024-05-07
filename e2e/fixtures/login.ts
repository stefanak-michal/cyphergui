import { expect, test as base } from '@playwright/test';

export const test = base.extend({
    page: async ({ page }, use) => {
        await page.goto('http://localhost:3000/');
        await page.locator('input[name="username"]').fill('neo4j');
        await page.locator('input[name="password"]').fill('nothing123');
        await page.getByRole('button', { name: 'Login' }).click();
        await expect(page.locator('#basicNavbar')).toBeVisible();

        await use(page);
    },
});

export { expect };
