import { test, expect } from './fixtures/login';
import { checkActiveTab, checkStashEntry, containerLocator, modalLocator } from './helpers';

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

    test('Add to stash btn', async ({ page }) => {
        await containerLocator(page).getByTitle('Add to stash').click();
        await expect(containerLocator(page).getByTitle('Remove from stash')).toHaveCount(1);

        const id = await containerLocator(page).getByLabel('identity').inputValue();
        await checkStashEntry(page, ':ACTED_IN', id);

        await containerLocator(page).getByTitle('Remove from stash').click();
        await checkStashEntry(page, ':ACTED_IN', id, 0);
    });

    test('Reload btn', async ({ page }) => {
        await containerLocator(page).getByRole('group', { name: 'Properties' }).getByText('Neo').fill('Neo 123');
        await containerLocator(page).getByRole('button', { name: 'Reload' }).click();
        await expect(containerLocator(page).getByRole('group', { name: 'Properties' }).getByText('Neo')).toHaveValue(
            'Neo'
        );
    });

    test('Execute btn', async ({ page }) => {
        await containerLocator(page).getByRole('button', { name: 'Execute' }).click();
        await expect(page.locator('.notifications')).toHaveText('Relationship updated');
        await checkActiveTab(page, 'ACTED_IN');
    });

    test('Close btn', async ({ page }) => {
        await containerLocator(page).getByRole('button', { name: 'Close' }).click();
        await checkActiveTab(page, 'ACTED_IN');
    });

    test('Delete btn', async ({ page }) => {
        await containerLocator(page).getByRole('button', { name: 'Delete' }).click();
        await expect(modalLocator(page)).toHaveScreenshot();
        await modalLocator(page).getByRole('button', { name: 'Cancel' }).click();
        await expect(modalLocator(page)).toHaveCount(0);
    });

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
        test.beforeEach(async ({ page }) => {
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
