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
        await expect(containerLocator(page, 'table tbody tr')).toHaveCount(20);
    });

    test('Table view pagination', async ({ page }) => {
        const text = await containerLocator(page, 'table tbody').textContent();
        await expect(containerLocator(page).getByLabel('Goto previous page')).toBeDisabled();
        await containerLocator(page).getByLabel('Goto page 2', { exact: true }).click();
        await expect(containerLocator(page).getByLabel('Goto previous page')).toBeEnabled();
        await expect(containerLocator(page, 'table tbody')).not.toHaveText(text);
        await containerLocator(page).getByLabel('Goto next page').click();
        await expect(containerLocator(page).getByLabel('Goto page 3', { exact: true })).toHaveAttribute('aria-current', 'page');
        await containerLocator(page).getByLabel('pagination').getByRole('button', { name: /\d+/ }).last().click();
        await expect(containerLocator(page).getByLabel('Goto next page')).toBeDisabled();
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
        await expect(async () => {
            await containerLocator(page).getByRole('searchbox').fill('');
            await containerLocator(page).getByRole('searchbox').fill('Hugo');
            await expect(containerLocator(page, 'table tbody tr')).toHaveCount(1);
        }).toPass();
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
        await expect(
            containerLocator(page, 'table tbody').getByRole('row').first().getByRole('cell').nth(4)
        ).toHaveText('1929');
        let last = 1929;
        for (let i = 0; i < 20; i++) {
            let year = parseInt(
                await containerLocator(page)
                    .getByRole('cell', { name: /^\d{4}$/ })
                    .nth(i)
                    .innerText()
            );
            expect(year).toBeGreaterThanOrEqual(last);
            last = year;
        }

        await containerLocator(page).getByRole('cell', { name: 'name' }).click();
        await containerLocator(page).getByRole('cell', { name: 'name' }).click();
        await expect(containerLocator(page, 'table tbody').getByRole('cell')).toContainText([
            'Richard Harris',
            'Gene Hackman',
            'Clint Eastwood',
            'Mike Nichols',
            'Milos Forman',
            'Tom Skerritt',
            'Jack Nicholson',
            'Frank Langella',
            'Ian McKellen',
            'John Hurt',
            'James L. Brooks',
            'James Cromwell',
            'Al Pacino',
            'Nora Ephron',
            'Jim Cash',
            'Werner Herzog',
            'Marshall Bell',
            'Penny Marshall',
            'Jan de Bont',
        ]);
    });
});
