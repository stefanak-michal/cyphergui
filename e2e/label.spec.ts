import { test, expect } from './fixtures/login';
import { checkActiveTab, containerLocator } from './helpers';

test.beforeEach('Go to', async ({ page }) => {
    await page.locator('.tabs a', { hasText: 'Start' }).click();
    await containerLocator(page).getByRole('button', { name: '*' }).first().click();
    await checkActiveTab(page, '*');
});

test('Table view', async ({ page }) => {
    await expect(containerLocator(page)).toHaveScreenshot({
        mask: [
            //hide ids and elementIds
            containerLocator(page, 'table tbody').getByRole('button', { name: /^#\d+$/ }),
            containerLocator(page, 'table tbody').getByRole('cell', { name: /^\d+:[a-z0-9\-]+:\d+$/ })
        ],
    });
});

test('Table view pagination', async ({ page }) => {
    await expect(containerLocator(page, '.pagination button.pagination-previous')).toBeDisabled();
    await containerLocator(page, '.pagination').getByRole('button', { name: '2' }).click();
    await expect(containerLocator(page, '.pagination button.pagination-previous')).toBeEnabled();
    await expect(containerLocator(page)).toHaveScreenshot({
        mask: [
            //hide ids and elementIds
            containerLocator(page, 'table tbody').getByRole('button', { name: /^#\d+$/ }),
            containerLocator(page, 'table tbody').getByRole('cell', { name: /^\d+:[a-z0-9\-]+:\d+$/ })
        ],
    });
    await containerLocator(page, '.pagination button.pagination-next').click();
    await expect(containerLocator(page, '.pagination').getByRole('button', { name: '3' })).toHaveClass(/is-current/);
    await containerLocator(page, '.pagination').getByRole('button', { name: '9' }).click();
    await expect(containerLocator(page, '.pagination button.pagination-next')).toBeDisabled();
});

test('Create node btn', async ({ page }) => {
    await containerLocator(page).getByRole('button', { name: 'Create node' }).click();
    await checkActiveTab(page, /New node#\d+/);
});

test('View as graph btn', async ({ page }) => {
    await containerLocator(page).getByRole('button', { name: 'View as graph' }).click();
    await checkActiveTab(page, /Query#\d+/);
});

test('Search input', async ({ page }) => {
    await containerLocator(page).getByPlaceholder('Search').fill('Hugo');
    await expect(containerLocator(page, 'table tbody tr')).toHaveCount(1);
});

test('Node btn', async ({ page }) => {
    await containerLocator(page)
        .getByRole('row', { name: 'Keanu Reeves' })
        .getByRole('button', { name: /#\d+/ })
        .click();
    await expect(page.locator('.tabs .is-active')).toHaveText(/Node#\d+/);
});

test('Add to stash btn', async ({ page }) => {
    await containerLocator(page).getByTitle('Add to stash').first().click();
    await expect(containerLocator(page).getByTitle('Remove from stash')).toHaveCount(1);
});

test('Delete node btn', async ({ page }) => {
    await containerLocator(page).getByTitle('Delete').first().click();
    await expect(containerLocator(page, '.modal .modal-card')).toHaveScreenshot();
    await containerLocator(page, '.modal').getByRole('button', { name: 'Confirm' }).click();
    // check and close error message
    await expect(containerLocator(page)).toContainText('Cannot delete node');
    await containerLocator(page, '.message').getByRole('button').click();
    await expect(containerLocator(page, '.message')).toHaveCount(0);
});

test('Label tag btn', async ({ page }) => {
    await containerLocator(page).getByRole('button', { name: ':Person' }).first().click();
    await checkActiveTab(page, 'Person');
});

test('Table sort', async ({ page }) => {
    await containerLocator(page).getByRole('cell', { name: 'born' }).click();
    await expect(containerLocator(page)).toHaveScreenshot({
        mask: [
            //hide ids and elementIds
            containerLocator(page, 'table tbody').getByRole('button', { name: /^#\d+$/ }),
            containerLocator(page, 'table tbody').getByRole('cell', { name: /^\d+:[a-z0-9\-]+:\d+$/ })
        ],
    });
    await containerLocator(page).getByRole('cell', { name: 'name' }).click();
    await containerLocator(page).getByRole('cell', { name: 'name' }).click();
    await expect(containerLocator(page)).toHaveScreenshot({
        mask: [
            //hide ids and elementIds
            containerLocator(page, 'table tbody').getByRole('button', { name: /^#\d+$/ }),
            containerLocator(page, 'table tbody').getByRole('cell', { name: /^\d+:[a-z0-9\-]+:\d+$/ })
        ],
    });
});
