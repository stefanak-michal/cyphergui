import { test, expect } from './fixtures/login';
import { checkActiveTab, containerLocator } from './helpers';

test.describe('History tab', { tag: '@read-only' }, () => {
    test.beforeEach('Go to', async ({ page }) => {
        await page.getByTitle('Open history').click();
        await checkActiveTab(page, 'History');
    });

    test('Visual check', async ({ page }) => {
        await expect(containerLocator(page)).toHaveScreenshot({
            mask: [containerLocator(page, 'table tbody tr td:first-child')],
        });
    });

    test('Open query', async ({ page }) => {
        await containerLocator(page).getByTitle('Open in query tab').first().click();
        await checkActiveTab(page, /Query#\d+/);
    });
});
