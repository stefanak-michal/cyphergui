import { test, expect } from './fixtures/read-only';
import { checkActiveTab, checkNotification, containerLocator } from './helpers';

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

    test('Copy query', async ({ page }) => {
        await containerLocator(page)
            .getByText(/^MATCH \(\)/)
            .first()
            .click();
        await expect(
            containerLocator(page)
                .getByText(/^MATCH \(\)/)
                .first()
        ).toHaveText(await page.evaluate('navigator.clipboard.readText();'));
        await checkNotification(page);
    });

    test('Copy parameters', async ({ page }) => {
        await containerLocator(page).getByRole('cell', { name: '{}' }).first().locator('.is-clickable').click();
        expect(await page.evaluate('navigator.clipboard.readText();')).toMatch('{}');
        await checkNotification(page);
    });
});
