import { test, expect } from '../fixtures/neo4j-movies';
import { checkActiveTab, checkNotification, containerLocator, modalLocator, switchToTab } from '../helpers';
import Stash from '../pom/Stash';

test.describe('Type tab', { tag: '@neo4j-read' }, () => {
    test.beforeEach('Go to', async ({ page }) => {
        await switchToTab(page, 'Start');
        await containerLocator(page).getByRole('button', { name: '*' }).last().click();
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

    test('Create relationship btn', async ({ page }) => {
        await containerLocator(page).getByRole('button', { name: 'Create relationship' }).click();
        await checkActiveTab(page, /New relationship#\d+/);
    });

    test('View as graph btn', async ({ page }) => {
        await containerLocator(page).getByRole('button', { name: 'View as graph' }).click();
        await checkActiveTab(page, /Query#\d+/);
    });

    test('Search input', async ({ page }) => {
        await expect(async () => {
            await containerLocator(page).getByRole('searchbox').fill('');
            await containerLocator(page).getByRole('searchbox').fill('2');
            await expect(containerLocator(page, 'table tbody tr')).not.toHaveCount(20);
        }).toPass();
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
        const stash = new Stash(page);
        const id = await containerLocator(page).getByRole('button', { name: /#\d+/ }).first().textContent();
        const type = await containerLocator(page).getByRole('button', { name: /:\w+/ }).first().textContent();
        await stash.checkEntry(type + id);
        await containerLocator(page).getByTitle('Remove from stash').click();
        await stash.checkEntry(type + id, 0);
    });

    test('Delete relationship btn', async ({ page }) => {
        await containerLocator(page).getByTitle('Delete').first().click();
        await expect(modalLocator(page)).toHaveScreenshot();
        await modalLocator(page).getByRole('button', { name: 'Cancel' }).click();
        await expect(modalLocator(page)).toHaveCount(0);
    });

    test('Label tag btn', async ({ page }) => {
        await containerLocator(page).getByRole('button', { name: ':ACTED_IN' }).first().click();
        await checkActiveTab(page, 'ACTED_IN');
    });

    test('Table sort', async ({ page }) => {
        await containerLocator(page).getByRole('cell', { name: 'roles' }).click();
        await expect(containerLocator(page, 'table tbody').getByRole('cell')).toContainText([
            '["All the Way" Mae Mordabito]',
            '["Wild Bill" Wharton]',
            '[Ace Merrill]',
            '[Admiral]',
            '[Agent Smith]',
            '[Agent Smith]',
            '[Agent Smith]',
            '[Albert Goldman]',
            '[Albert Lewis]',
            '[Andrew Marin]',
            '[Annabelle Farrell]',
            '[Annie Collins-Nielsen]',
            '[Annie Reed]',
            '[Armand Goldman]',
            '[Avery Bishop]',
            '[Baw]',
            '[Becky]',
            '[Bill Harding]',
            '[Bill Munny]',
            '[Bill Smoke, Haskell Moore, Tadeusz Kesselring, Nurse Noakes, Boardman Mephi, Old Georgie]',
        ]);
    });
});
