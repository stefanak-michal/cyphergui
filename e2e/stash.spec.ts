import { test, expect } from './fixtures/read-only';
import { checkActiveTab, containerLocator, modalLocator } from './helpers';
import Stash from './pom/Stash';

test.describe('Stash', { tag: '@read-only' }, () => {
    test('Node', async ({ page }) => {
        const stash = new Stash(page);
        const hugoLocator = containerLocator(page).getByRole('row').filter({ hasText: 'Hugo Weaving' });
        // open label table
        await page.locator('.tabs a', { hasText: 'Start' }).click();
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
        await page.locator('.tabs a', { hasText: 'Start' }).click();
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

    test('Query', async () => {
        test.skip();
    });
});
