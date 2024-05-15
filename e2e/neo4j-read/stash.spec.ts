import { test, expect } from '../fixtures/neo4j-movies';
import { checkActiveTab, containerLocator, modalLocator, switchToTab } from '../helpers';
import Stash from '../pom/Stash';

test.describe('Stash', { tag: '@neo4j-read' }, () => {
    test('Node', async ({ page }) => {
        const stash = new Stash(page);
        const hugoLocator = containerLocator(page).getByRole('row').filter({ hasText: 'Hugo Weaving' });
        // open label table
        await switchToTab(page, 'Start');
        await containerLocator(page).getByRole('button', { name: ':Person' }).click();
        await checkActiveTab(page, 'Person');
        // add to stash
        await hugoLocator.getByTitle('Add to stash').click();
        await expect(hugoLocator.getByTitle('Remove from stash')).toHaveCount(1);
        // check it was added to stash
        const id = await hugoLocator.getByRole('button', { name: /#\d+/ }).textContent();
        await stash.checkEntry(':Person' + id);
        // open stash
        await stash.open();
        // edit node click
        await stash.getEntryLocator(id).getByRole('button', { name: /#\d+/ }).click();
        await checkActiveTab(page, /Node#\d+/);
        // label click
        await stash.getEntryLocator(id).getByRole('button', { name: ':Person' }).click();
        await checkActiveTab(page, 'Person');
        // properties click
        await stash.getEntryLocator(id).getByTitle('Properties').click();
        await expect(modalLocator(page)).toHaveScreenshot();
        await modalLocator(page).getByRole('button').click();
        await expect(modalLocator(page)).toHaveCount(0);
        // remove from stash
        await stash.getEntryLocator(id).getByRole('button').last().click();
        // final check
        await stash.checkEntry(':Person' + id, 0);
        await expect(hugoLocator.getByTitle('Remove from stash')).toHaveCount(0);
    });

    test('Relationship', async ({ page }) => {
        const stash = new Stash(page);
        const morpheusLocator = containerLocator(page).getByRole('row').filter({ hasText: '[Morpheus]' }).first();
        // open type table
        await switchToTab(page, 'Start');
        await containerLocator(page).getByRole('button', { name: ':ACTED_IN' }).click();
        await checkActiveTab(page, 'ACTED_IN');
        // add to stash
        await morpheusLocator.getByTitle('Add to stash').click();
        await expect(morpheusLocator.getByTitle('Remove from stash')).toHaveCount(1);
        // check it was added to stash
        const id = await morpheusLocator.getByRole('button', { name: /#\d+/ }).first().textContent();
        await stash.checkEntry(':ACTED_IN' + id);
        // open stash
        await stash.open();
        // edit node click
        await stash.getEntryLocator(id).getByRole('button', { name: /#\d+/ }).click();
        await checkActiveTab(page, /Rel#\d+/);
        // label click
        await stash.getEntryLocator(id).getByRole('button', { name: ':ACTED_IN' }).click();
        await checkActiveTab(page, 'ACTED_IN');
        // properties click
        await stash.getEntryLocator(id).getByTitle('Properties').click();
        await expect(modalLocator(page)).toHaveScreenshot();
        await modalLocator(page).getByRole('button').click();
        await expect(modalLocator(page)).toHaveCount(0);
        // remove from stash
        await stash.getEntryLocator(id).getByRole('button').last().click();
        // final check
        await stash.checkEntry(':ACTED_IN' + id, 0);
        await expect(morpheusLocator.getByTitle('Remove from stash')).toHaveCount(0);
    });

    test('Query', async ({ page }) => {
        const query: string = 'MATCH (n:Person) RETURN n, n {.*} AS props ORDER BY id(n) LIMIT 10';
        // add query to stash
        await page.getByRole('button', { name: 'Query' }).click();
        await checkActiveTab(page, /Query#\d+/);
        await containerLocator(page, 'textarea[name="query"]').fill(query);
        await containerLocator(page).getByRole('button', { name: 'Execute' }).click();
        await containerLocator(page).getByTitle('Add to stash').click();
        await expect(containerLocator(page).getByTitle('Remove from stash')).toHaveCount(1);

        const stash = new Stash(page);
        await stash.checkEntry(query);
        // close query tab
        await containerLocator(page).getByRole('button', { name: 'Close' }).click();
        await checkActiveTab(page, 'Start');
        // reopen query tab from stash
        await stash.open();
        await stash.getEntryLocator(query).click();
        await checkActiveTab(page, /Query#\d+/);
        await expect(containerLocator(page, 'textarea[name="query"]')).toHaveValue(query);
        // remove from stash
        await stash.getEntryLocator(query).getByRole('button').last().click();
        // final check
        await stash.checkEntry(query, 0);
        await expect(containerLocator(page).getByTitle('Remove from stash')).toHaveCount(0);
    });
});
