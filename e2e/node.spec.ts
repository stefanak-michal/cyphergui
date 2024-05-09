import { test, expect } from './fixtures/login';
import { checkActiveTab, checkErrorMessage, checkStashEntry, containerLocator, modalLocator } from './helpers';

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

        const id = await containerLocator(page).getByLabel('identity').inputValue();
        await checkStashEntry(page, ':Person', id);

        await containerLocator(page).getByTitle('Remove from stash').click();
        await checkStashEntry(page, ':Person', id, 0);
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
        await expect(modalLocator(page)).toHaveScreenshot();
        await modalLocator(page).getByRole('button', { name: 'Confirm' }).click();
        await expect(modalLocator(page)).toHaveCount(0);
        await checkErrorMessage(page, 'Cannot delete node');
    });

    test('Own label click', async ({ page }) => {
        await containerLocator(page).getByRole('group', { name: 'Labels' }).locator('a').click();
        await checkActiveTab(page, 'Person');
    });

    test('Remove label', async ({ page }) => {
        await containerLocator(page).getByRole('group', { name: 'Labels' }).getByRole('button').first().click();
        await expect(containerLocator(page).getByRole('group', { name: 'Labels' })).toHaveScreenshot();
    });

    test('Add existing label', async ({ page }) => {
        await containerLocator(page)
            .getByRole('group', { name: 'Labels' })
            .getByRole('button', { name: '+', exact: true })
            .click();
        await expect(modalLocator(page)).toHaveScreenshot();
        await modalLocator(page).getByRole('button', { name: 'Movie' }).click();
        await expect(modalLocator(page)).toHaveCount(0);
        await expect(containerLocator(page).getByRole('group', { name: 'Labels' })).toHaveScreenshot();
    });

    test('Add new label', async ({ page }) => {
        await containerLocator(page)
            .getByRole('group', { name: 'Labels' })
            .getByRole('button', { name: '+', exact: true })
            .click();
        await modalLocator(page).getByRole('textbox').fill('Test');
        await modalLocator(page).locator('button[type="submit"]').click();
        await expect(containerLocator(page).getByRole('group', { name: 'Labels' })).toHaveScreenshot();
    });

    test.describe('Relationship group', () => {
        test('Show all btn', async ({ page }) => {
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

        test('Type click', async ({ page }) => {
            await containerLocator(page)
                .getByRole('group', { name: 'Relationships' })
                .getByRole('button', { name: ':ACTED_IN' })
                .first()
                .click();
            await checkActiveTab(page, 'ACTED_IN');
        });

        test('Rel edit click', async ({ page }) => {
            await containerLocator(page)
                .getByRole('group', { name: 'Relationships' })
                .getByRole('button', { name: /#\d+/ })
                .first()
                .click();
            await checkActiveTab(page, /Rel#\d+/);
        });

        test('Rel properties click', async ({ page }) => {
            await containerLocator(page)
                .getByRole('group', { name: 'Relationships' })
                .getByRole('button')
                .nth(2)
                .click();
            await expect(modalLocator(page)).toHaveScreenshot();
            await modalLocator(page).getByRole('button').click();
            await expect(modalLocator(page)).toHaveCount(0);
        });

        test('Label click', async ({ page }) => {
            await containerLocator(page)
                .getByRole('group', { name: 'Relationships' })
                .getByRole('button', { name: ':MOVIE' })
                .first()
                .click();
            await checkActiveTab(page, 'Movie');
        });

        test('Node edit click', async ({ page }) => {
            await containerLocator(page)
                .getByRole('group', { name: 'Relationships' })
                .getByRole('button', { name: /#\d+/ })
                .nth(1)
                .click();
            await checkActiveTab(page, /Node#\d+/);
        });

        test('Node properties click', async ({ page }) => {
            await containerLocator(page)
                .getByRole('group', { name: 'Relationships' })
                .getByRole('button')
                .nth(5)
                .click();
            await expect(modalLocator(page)).toHaveScreenshot();
            await modalLocator(page).getByRole('button').click();
            await expect(modalLocator(page)).toHaveCount(0);
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
            await expect(modalLocator(page)).toHaveScreenshot();
            await modalLocator(page).getByRole('button', { name: 'Close anyway' }).click();
            await checkActiveTab(page, 'Person');
        });

        test('Cancel', async ({ page }) => {
            await modalLocator(page).getByRole('button', { name: "Don't close" }).click();
            await checkActiveTab(page, /Node#\d+/);
        });
    });
});

test.describe('Node tab 2', { tag: '@read-write' }, () => {
    //todo read-write tests
});
