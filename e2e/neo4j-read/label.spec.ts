import { test, expect } from '../fixtures/neo4j-movies';
import {
    checkActiveTab,
    checkErrorMessage,
    checkNotification,
    containerLocator,
    modalLocator,
    switchToTab,
} from '../helpers';
import Stash from '../pom/Stash';

test.describe('Label tab', { tag: '@neo4j-read' }, () => {
    test.beforeEach('Go to', async ({ page }) => {
        await switchToTab(page, 'Start');
        await containerLocator(page).getByRole('button', { name: '*' }).first().click();
        await checkActiveTab(page, '*');
    });

    test('Table view', async ({ page }) => {
        await expect(containerLocator(page)).toHaveScreenshot({
            mask: [
                //hide ids and elementIds
                containerLocator(page, 'table tbody')
                    .getByRole('button')
                    .getByText(/^#\d+$/),
                containerLocator(page, 'table tbody').getByRole('cell', { name: /^\d+:[a-z0-9\-]+:\d+$/ }),
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
                containerLocator(page, 'table tbody')
                    .getByRole('button')
                    .getByText(/^#\d+$/),
                containerLocator(page, 'table tbody').getByRole('cell', { name: /^\d+:[a-z0-9\-]+:\d+$/ }),
            ],
        });
        await containerLocator(page).getByLabel('Goto next page').click();
        await expect(containerLocator(page).getByLabel('Goto page 3')).toHaveAttribute('aria-current', 'page');
        await containerLocator(page).getByLabel('pagination').getByRole('button', { name: /\d+/ }).last().click();
        await expect(containerLocator(page).getByLabel('pagination').getByLabel('Goto next page')).toBeDisabled();
    });

    test('Copy query', async ({ page }) => {
        await containerLocator(page)
            .getByText(/^MATCH /)
            .click();
        await expect(containerLocator(page).getByText(/^MATCH /)).toHaveText(
            await page.evaluate('navigator.clipboard.readText();')
        );
        await checkNotification(page);
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
        await containerLocator(page).getByRole('searchbox').fill('Hugo');
        await expect(containerLocator(page, 'table tbody tr')).toHaveCount(1);
    });

    test('Node btn', async ({ page }) => {
        await containerLocator(page)
            .getByRole('row', { name: 'Keanu Reeves' })
            .getByRole('button', { name: /#\d+/ })
            .click();
        await checkActiveTab(page, /Node#\d+/);
    });

    test('Add to stash btn', async ({ page }) => {
        await containerLocator(page).getByTitle('Add to stash').first().click();
        await expect(containerLocator(page).getByTitle('Remove from stash')).toHaveCount(1);
        const stash = new Stash(page);
        const id = await containerLocator(page).getByRole('button', { name: /#\d+/ }).first().textContent();
        const label = await containerLocator(page).getByRole('button', { name: /:\w+/ }).first().textContent();
        await stash.checkEntry(label + id);
        await containerLocator(page).getByTitle('Remove from stash').click();
        await stash.checkEntry(label + id, 0);
    });

    test('Delete node btn', async ({ page }) => {
        await containerLocator(page).getByTitle('Delete').first().click();
        await expect(modalLocator(page)).toHaveScreenshot();
        await modalLocator(page).getByRole('button', { name: 'Confirm' }).click();
        await expect(modalLocator(page)).toHaveCount(0);
        await checkErrorMessage(page, 'Cannot delete node');
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
                containerLocator(page, 'table tbody')
                    .getByRole('button')
                    .getByText(/^#\d+$/),
                containerLocator(page, 'table tbody').getByRole('cell', { name: /^\d+:[a-z0-9\-]+:\d+$/ }),
            ],
        });
        await containerLocator(page).getByRole('cell', { name: 'name' }).click();
        await containerLocator(page).getByRole('cell', { name: 'name' }).click();
        await expect(containerLocator(page)).toHaveScreenshot({
            mask: [
                //hide ids and elementIds
                containerLocator(page, 'table tbody')
                    .getByRole('button')
                    .getByText(/^#\d+$/),
                containerLocator(page, 'table tbody').getByRole('cell', { name: /^\d+:[a-z0-9\-]+:\d+$/ }),
            ],
        });
    });
});
