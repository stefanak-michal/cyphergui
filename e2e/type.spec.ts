import { test, expect } from "./fixtures/login";
import { checkActiveTab, containerLocator } from './helpers';

test.beforeEach('Go to', async ({ page }) => {
    await page.locator('.tabs a', { hasText: 'Start' }).click();
    await containerLocator(page).getByRole('button', { name: '*' }).last().click();
    await checkActiveTab(page, '*');
});

test.use({ viewport: { width: 1920, height: 1800 }});

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
    await expect(containerLocator(page).getByLabel('Goto previous page')).toBeDisabled();
    await containerLocator(page).getByLabel('Goto page 2').click();
    await expect(containerLocator(page).getByLabel('Goto previous page')).toBeEnabled();
    await expect(containerLocator(page)).toHaveScreenshot({
        mask: [
            //hide ids and elementIds
            containerLocator(page, 'table tbody').getByRole('button', { name: /^#\d+$/ }),
            containerLocator(page, 'table tbody').getByRole('cell', { name: /^\d+:[a-z0-9\-]+:\d+$/ })
        ],
    });
    await containerLocator(page).getByLabel('Goto next page').click();
    await expect(containerLocator(page).getByLabel('Goto page 3')).toHaveAttribute('aria-current', 'page');
    await containerLocator(page).getByLabel('pagination').getByRole('button', { name: /\d+/ }).last().click();
    await expect(containerLocator(page).getByLabel('Goto next page')).toBeDisabled();
});

test('Create relationship btn', async ({ page }) => {
    await containerLocator(page).getByRole('button', { name: 'Create relationship' }).click();
    await checkActiveTab(page, /New relationship#\d+/);
});

test('View as graph btn', async ({ page }) => {
    await containerLocator(page).getByRole('button', { name: 'View as graph' }).click();
    await checkActiveTab(page, /Query#\d+/);
});

test('Search input', async ({ page }) => {
    await containerLocator(page).getByRole('searchbox').fill('2');
    await expect(containerLocator(page, 'table tbody tr')).toHaveCount(3);
});

test('Relationship btn', async ({ page }) => {
    await containerLocator(page)
        .getByRole('row', { name: '[Neo]' })
        .getByRole('button', { name: /#\d+/ })
        .first()
        .click();
    await checkActiveTab(page, /Rel#\d+/);
});

test('Node btn', async ({ page }) => {
    await containerLocator(page)
        .getByRole('row', { name: '[Neo]' })
        .getByRole('button', { name: /#\d+/ })
        .last()
        .click();
    await checkActiveTab(page, /Node#\d+/);
});

test('Add to stash btn', async ({ page }) => {
    await containerLocator(page).getByTitle('Add to stash').first().click();
    await expect(containerLocator(page).getByTitle('Remove from stash')).toHaveCount(1);
});

test('Delete relationship btn', async ({ page }) => {
    await containerLocator(page).getByTitle('Delete').first().click();
    await expect(containerLocator(page, '.modal .modal-card')).toHaveScreenshot();
    await containerLocator(page, '.modal').getByRole('button', { name: 'Cancel' }).click();
});

test('Label tag btn', async ({ page }) => {
    await containerLocator(page).getByRole('button', { name: ':ACTED_IN' }).first().click();
    await checkActiveTab(page, 'ACTED_IN');
});

test('Table sort', async ({ page }) => {
    await containerLocator(page).getByRole('cell', { name: 'roles' }).click();
    await expect(containerLocator(page)).toHaveScreenshot({
        mask: [
            //hide ids and elementIds
            containerLocator(page, 'table tbody').getByRole('button', { name: /^#\d+$/ }),
            containerLocator(page, 'table tbody').getByRole('cell', { name: /^\d+:[a-z0-9\-]+:\d+$/ })
        ],
    });
});
