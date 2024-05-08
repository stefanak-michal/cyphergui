import { test, expect } from './fixtures/login';
import { checkActiveTab, checkErrorMessage, containerLocator } from './helpers';

test.describe('Node tab 1', { tag: '@read-only' }, () => {
    test.beforeEach('Go to', async ({ page }) => {
        await page.locator('.tabs a', { hasText: 'Start' }).click();
        await containerLocator(page).getByRole('button', { name: ':Person' }).first().click();
        await checkActiveTab(page, 'Person');

        await containerLocator(page).getByRole('searchbox').fill('Keanu Reeves');
        await expect(containerLocator(page, 'table tbody tr')).toHaveCount(1);
        await containerLocator(page).getByRole('button', { name: /#\d+/ }).click();
        await checkActiveTab(page, /Node#\d+/);
    });

    test('Visual check', async ({ page }) => {
        await expect(containerLocator(page).getByLabel('identity')).toHaveValue(/^\d+$/);
        await expect(containerLocator(page).getByLabel('elementId')).toHaveValue(/^\d+:[a-z0-9\-]+:\d+$/);

        await expect(containerLocator(page).getByRole('group', { name: 'Labels' })).toHaveScreenshot();
        await expect(containerLocator(page).getByRole('group', { name: 'Properties' })).toHaveScreenshot();
        await expect(containerLocator(page).getByRole('group', { name: 'Relationships' })).toHaveScreenshot({
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
    });

    test('Reload btn', async ({ page }) => {
        await containerLocator(page)
            .getByRole('group', { name: 'Properties' })
            .getByText('Keanu Reeves')
            .fill('Keanu Reeves 123');
        await containerLocator(page).getByRole('button', { name: 'Reload' }).click();
        await expect(
            containerLocator(page).getByRole('group', { name: 'Properties' }).getByText('Keanu Reeves')
        ).toHaveValue('Keanu Reeves');
    });

    test('Execute btn', async ({ page }) => {
        await containerLocator(page).getByRole('button', { name: 'Execute' }).click();
        await expect(page.locator('.notifications')).toHaveText('Node updated');
        await checkActiveTab(page, 'Person');
    });

    test('Close btn', async ({ page }) => {
        await containerLocator(page).getByRole('button', { name: 'Close' }).click();
        await checkActiveTab(page, 'Person');
    });

    test('Delete btn', async ({ page }) => {
        await containerLocator(page).getByRole('button', { name: 'Delete' }).click();
        await expect(containerLocator(page, '.modal .modal-card')).toHaveScreenshot();
        await containerLocator(page, '.modal').getByRole('button', { name: 'Confirm' }).click();
        await checkErrorMessage(page, 'Cannot delete node');
    });

    test('Own label click', async ({ page }) => {
        await containerLocator(page).getByRole('group', { name: 'Labels' }).locator('a').click();
        await checkActiveTab(page, 'Person');
    });

    //relationship group:
    // label and rel click, node edit click, rel edit click, props modal click

    test('Show all relationships', async ({ page }) => {
        await containerLocator(page)
            .getByRole('group', { name: 'Relationships' })
            .getByRole('button', { name: 'Show all' })
            .click();
        await expect(containerLocator(page).getByRole('group', { name: 'Relationships' })).toHaveScreenshot({
            mask: [
                containerLocator(page)
                    .getByRole('button')
                    .getByText(/^#\d+$/),
            ],
        });
    });

    test.describe('Modal for unsaved changes', () => {
        test.beforeEach(async ({ page }) => {
            await containerLocator(page)
                .getByRole('group', { name: 'Properties' })
                .getByText('Keanu Reeves')
                .fill('Keanu Reeves 123');
            await containerLocator(page).getByRole('button', { name: 'Close' }).click();
        });

        test('Close', async ({ page }) => {
            const modal = page.locator('.modal .modal-card').locator('visible=true');
            await expect(modal).toHaveScreenshot();
            await modal.getByRole('button', { name: 'Close anyway' }).click();
            await checkActiveTab(page, 'Person');
        });

        test('Cancel', async ({ page }) => {
            const modal = page.locator('.modal .modal-card').locator('visible=true');
            await modal.getByRole('button', { name: "Don't close" }).click();
            await checkActiveTab(page, /Node#\d+/);
        });
    });
});

test.describe('Node tab 2', () => {
    //read-write tests
});
