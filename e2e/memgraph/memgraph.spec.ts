import { expect, test } from '../fixtures/login';

test.describe('Memgraph Tests', { tag: '@memgraph' }, () => {
    test('Login successful', async ({ page }) => {
        await expect(page.locator('#basicNavbar')).toBeVisible();
    });
});
