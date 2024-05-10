import { test, expect } from './fixtures/read-only';
import { checkActiveTab, checkNotification, containerLocator, modalLocator } from './helpers';
import Stash from './pom/Stash';

test.describe('Relationship tab', { tag: '@read-only' }, () => {
    test.beforeEach('Go to', async ({ page }) => {
        await page.locator('.tabs a', { hasText: 'Start' }).click();
        await containerLocator(page).getByRole('button', { name: ':ACTED_IN' }).first().click();
        await checkActiveTab(page, 'ACTED_IN');

        await containerLocator(page)
            .getByRole('row')
            .filter({ hasText: '[Neo]' })
            .first()
            .getByRole('button', { name: /#\d+/ })
            .first()
            .click();
        await checkActiveTab(page, /Rel#\d+/);
    });

    test('Visual check', async ({ page }) => {
        await expect(containerLocator(page).getByLabel('identity')).toHaveValue(/^\d+$/);
        await expect(containerLocator(page).getByLabel('elementId')).toHaveValue(/^\d+:[a-z0-9\-]+:\d+$/);

        await expect(containerLocator(page).getByRole('group', { name: 'Type' })).toHaveScreenshot();
        await expect(containerLocator(page).getByRole('group', { name: 'Properties' })).toHaveScreenshot();
        await expect(containerLocator(page).getByRole('group', { name: 'Start node' })).toHaveScreenshot({
            mask: [
                containerLocator(page)
                    .getByRole('button')
                    .getByText(/^#\d+$/),
            ],
        });
        await expect(containerLocator(page).getByRole('group', { name: 'End node' })).toHaveScreenshot({
            mask: [
                containerLocator(page)
                    .getByRole('button')
                    .getByText(/^#\d+$/),
            ],
        });
    });

    test.describe('Buttons', () => {
        test('Add to stash', async ({ page }) => {
            await containerLocator(page).getByTitle('Add to stash').click();
            await expect(containerLocator(page).getByTitle('Remove from stash')).toHaveCount(1);
            const stash = new Stash(page);
            const id = await containerLocator(page).getByLabel('identity').inputValue();
            await stash.checkEntry(':ACTED_IN#' + id);
            await containerLocator(page).getByTitle('Remove from stash').click();
            await stash.checkEntry(':ACTED_IN#' + id, 0);
        });

        test('Reload', async ({ page }) => {
            await containerLocator(page).getByRole('group', { name: 'Properties' }).getByText('Neo').fill('Neo 123');
            await containerLocator(page).getByRole('button', { name: 'Reload' }).click();
            await expect(
                containerLocator(page).getByRole('group', { name: 'Properties' }).getByText('Neo')
            ).toHaveValue('Neo');
        });

        test('Execute', async ({ page }) => {
            await containerLocator(page).getByRole('button', { name: 'Execute' }).click();
            await checkNotification(page, 'Relationship updated');
            await checkActiveTab(page, 'ACTED_IN');
        });

        test('Close', async ({ page }) => {
            await containerLocator(page).getByRole('button', { name: 'Close' }).click();
            await checkActiveTab(page, 'ACTED_IN');
        });

        test('Delete', async ({ page }) => {
            await containerLocator(page).getByRole('button', { name: 'Delete' }).click();
            await expect(modalLocator(page)).toHaveScreenshot();
            await modalLocator(page).getByRole('button', { name: 'Cancel' }).click();
            await expect(modalLocator(page)).toHaveCount(0);
        });
    });

    test.describe('Copy', () => {
        test('identity', async ({ page }) => {
            await containerLocator(page).getByLabel('identity').click();
            await expect(containerLocator(page).getByLabel('identity')).toHaveValue(
                await page.evaluate('navigator.clipboard.readText();')
            );
            await checkNotification(page);
        });

        test('elementId', async ({ page }) => {
            await containerLocator(page).getByLabel('elementId').click();
            await expect(containerLocator(page).getByLabel('elementId')).toHaveValue(
                await page.evaluate('navigator.clipboard.readText();')
            );
            await checkNotification(page);
        });

        test('property value', async ({ page }) => {
            await containerLocator(page)
                .getByRole('group', { name: 'Properties' })
                .locator('div')
                .filter({ hasText: 'Neo' })
                .locator('.is-clickable')
                .click();
            expect(await page.evaluate('navigator.clipboard.readText();')).toMatch('Neo');
            await checkNotification(page);
        });

        test('query', async ({ page }) => {
            await containerLocator(page)
                .getByText(/^MATCH /)
                .click();
            await expect(containerLocator(page).getByText(/^MATCH /)).toHaveText(
                await page.evaluate('navigator.clipboard.readText();')
            );
            await checkNotification(page);
        });
    });

    test.describe('Type', () => {
        test('Own type click', async ({ page }) => {
            await containerLocator(page).getByRole('group', { name: 'Type' }).locator('a').click();
            await checkActiveTab(page, 'ACTED_IN');
        });

        test('Change type to existing', async ({ page }) => {
            await containerLocator(page).getByRole('group', { name: 'Type' }).getByRole('button').click();
            await expect(modalLocator(page)).toHaveScreenshot();
            await modalLocator(page).getByRole('button', { name: 'DIRECTED' }).click();
            await expect(modalLocator(page)).toHaveCount(0);
            await expect(containerLocator(page).getByRole('group', { name: 'Type' })).toHaveScreenshot();
        });

        test('Change type to new', async ({ page }) => {
            await containerLocator(page).getByRole('group', { name: 'Type' }).getByRole('button').click();
            await modalLocator(page).getByRole('textbox').fill('TEST');
            await modalLocator(page).locator('button[type="submit"]').click();
            await expect(containerLocator(page).getByRole('group', { name: 'Type' })).toHaveScreenshot();
        });
    });

    test.describe('Start node group', () => {
        test('Label click', async ({ page }) => {
            await containerLocator(page)
                .getByRole('group', { name: 'Start node' })
                .getByRole('button', { name: ':Person' })
                .click();
            await checkActiveTab(page, 'Person');
        });

        test('Node edit click', async ({ page }) => {
            await containerLocator(page)
                .getByRole('group', { name: 'Start node' })
                .getByRole('button', { name: /#\d+/ })
                .click();
            await checkActiveTab(page, /Node#\d+/);
        });

        test('Node properties click', async ({ page }) => {
            await containerLocator(page).getByRole('group', { name: 'Start node' }).getByRole('button').nth(2).click();
            await expect(modalLocator(page)).toHaveScreenshot();
            await modalLocator(page).locator('.is-clickable').click();
            await checkNotification(page);
            await modalLocator(page).getByRole('button').click();
            await expect(modalLocator(page)).toHaveCount(0);
        });

        test('Change node', async ({ page }) => {
            await containerLocator(page)
                .getByRole('group', { name: 'Start node' })
                .getByRole('button', { name: 'Change' })
                .click();
            await expect(modalLocator(page)).toHaveScreenshot();
            await modalLocator(page).getByRole('textbox').fill('2');
            await modalLocator(page).locator('button[type="submit"]').click();
            await expect(modalLocator(page)).toHaveCount(0);
            await expect(containerLocator(page).getByRole('group', { name: 'Start node' })).toHaveScreenshot();
        });
    });

    test.describe('End node group', () => {
        test('Label click', async ({ page }) => {
            await containerLocator(page)
                .getByRole('group', { name: 'End node' })
                .getByRole('button', { name: ':Movie' })
                .click();
            await checkActiveTab(page, 'Movie');
        });

        test('Node edit click', async ({ page }) => {
            await containerLocator(page)
                .getByRole('group', { name: 'End node' })
                .getByRole('button', { name: /#\d+/ })
                .click();
            await checkActiveTab(page, /Node#\d+/);
        });

        test('Node properties click', async ({ page }) => {
            await containerLocator(page).getByRole('group', { name: 'End node' }).getByRole('button').nth(2).click();
            await expect(modalLocator(page)).toHaveScreenshot();
            await modalLocator(page).locator('.is-clickable').click();
            await checkNotification(page);
            await modalLocator(page).getByRole('button').click();
            await expect(modalLocator(page)).toHaveCount(0);
        });

        test('Change node', async ({ page }) => {
            await containerLocator(page)
                .getByRole('group', { name: 'End node' })
                .getByRole('button', { name: 'Change' })
                .click();
            await expect(modalLocator(page)).toHaveScreenshot();
            await modalLocator(page).getByRole('textbox').fill('3');
            await modalLocator(page).locator('button[type="submit"]').click();
            await expect(modalLocator(page)).toHaveCount(0);
            await expect(containerLocator(page).getByRole('group', { name: 'End node' })).toHaveScreenshot();
        });
    });

    test.describe('Modal for unsaved changes', () => {
        test.beforeEach('Invoke modal', async ({ page }) => {
            await containerLocator(page).getByRole('group', { name: 'Properties' }).getByText('Neo').fill('Neo 123');
            await containerLocator(page).getByRole('button', { name: 'Close' }).click();
        });

        test('Close', async ({ page }) => {
            await expect(modalLocator(page)).toHaveScreenshot();
            await modalLocator(page).getByRole('button', { name: 'Close anyway' }).click();
            await checkActiveTab(page, 'ACTED_IN');
        });

        test('Cancel', async ({ page }) => {
            await modalLocator(page).getByRole('button', { name: "Don't close" }).click();
            await checkActiveTab(page, /Rel#\d+/);
        });
    });
});
