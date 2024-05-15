import { test, expect } from '../fixtures/neo4j-movies';
import { checkActiveTab, checkNotification, containerLocator, modalLocator } from '../helpers';
import Stash from '../pom/Stash';

test.describe('Query tab', { tag: '@neo4j-read' }, () => {
    test.beforeEach('Go to', async ({ page }) => {
        await page.getByRole('button', { name: 'Query' }).click();
        await checkActiveTab(page, /Query#\d+/);
    });

    test('Visual check', async ({ page }) => {
        await expect(containerLocator(page)).toHaveScreenshot();
    });

    test('Doc link', async ({ page, context }) => {
        const pagePromise = context.waitForEvent('page');
        await containerLocator(page).getByTitle('Cypher documentation').click();
        const newPage = await pagePromise;
        await expect(newPage).toHaveURL(/https:\/\/neo4j.com.*/);
    });

    test('Close btn', async ({ page }) => {
        await containerLocator(page).getByRole('button', { name: 'Close' }).click();
        await checkActiveTab(page, 'Start');
    });

    test.describe('With query', () => {
        test.beforeEach('Execute query', async ({ page }) => {
            await containerLocator(page, 'textarea[name="query"]').fill(
                'MATCH (n:Person) RETURN n, n {.*} AS props ORDER BY id(n) LIMIT 10'
            );
            await containerLocator(page).getByRole('button', { name: 'Execute' }).click();
        });

        test('Copy query', async ({ page }) => {
            await containerLocator(page, 'div.control .is-clickable').first().click();
            await expect(containerLocator(page).getByRole('textbox')).toHaveText(
                await page.evaluate('navigator.clipboard.readText();')
            );
            await checkNotification(page);
        });

        test('Stash btn', async ({ page }) => {
            await containerLocator(page).getByTitle('Add to stash').click();
            await expect(containerLocator(page).getByTitle('Remove from stash')).toHaveCount(1);
            const stash = new Stash(page);
            await stash.checkEntry(/MATCH \(n:Person\).+/);
            await containerLocator(page).getByTitle('Remove from stash').click();
            await stash.checkEntry(/MATCH \(n:Person\).+/, 0);
        });

        test('Table - medium', async ({ page }) => {
            await containerLocator(page).getByRole('button', { name: 'Table' }).click();
            await containerLocator(page).getByRole('button', { name: 'Medium' }).click();
            await expect(containerLocator(page, 'table')).toHaveScreenshot({
                mask: [
                    containerLocator(page, 'table tbody')
                        .getByRole('button')
                        .getByText(/^#\d+$/),
                ],
            });
        });

        test('Table - small', async ({ page }) => {
            await containerLocator(page).getByRole('button', { name: 'Table' }).click();
            await containerLocator(page).getByRole('button', { name: 'Small' }).click();
            await expect(containerLocator(page, 'table')).toHaveScreenshot({
                mask: [
                    containerLocator(page, 'table tbody')
                        .getByRole('button')
                        .getByText(/^#\d+$/),
                ],
            });
        });

        test.describe('Table buttons', () => {
            test.beforeEach(async ({ page }) => {
                await containerLocator(page).getByRole('button', { name: 'Table' }).click();
                await expect(containerLocator(page, 'table')).toHaveCount(1);
            });

            test('Label', async ({ page }) => {
                await containerLocator(page, 'table').getByRole('button', { name: ':Person' }).first().click();
                await checkActiveTab(page, 'Person');
            });

            test('Edit node', async ({ page }) => {
                await containerLocator(page, 'table').getByRole('button', { name: /#\d+/ }).first().click();
                await checkActiveTab(page, /Node#\d+/);
            });

            test('Properties', async ({ page }) => {
                await containerLocator(page, 'table').getByRole('button').nth(2).click();
                await expect(modalLocator(page)).toHaveScreenshot();
                await modalLocator(page).locator('.is-clickable').click();
                await checkNotification(page);
                await modalLocator(page).getByRole('button').click();
                await expect(modalLocator(page)).toHaveCount(0);
            });
        });

        test('JSON', async ({ page }) => {
            await containerLocator(page).getByRole('button', { name: 'JSON' }).click();
            expect(JSON.parse(await containerLocator(page).getByText('Keanu Reeves').textContent())).toBeTruthy();

            //copy test
            await containerLocator(page, 'div.control pre + .is-clickable').click();
            await expect(containerLocator(page).getByText('Keanu Reeves')).toHaveText(
                await page.evaluate('navigator.clipboard.readText();')
            );
            await checkNotification(page);
        });

        test.describe('Graph', () => {
            test.beforeEach(async ({ page }) => {
                await containerLocator(page).getByRole('button', { name: 'Graph' }).click();
                await expect(containerLocator(page, 'canvas')).toHaveCount(1);
            });

            test('Click label', async ({ page }) => {
                await expect(containerLocator(page).getByRole('button', { name: ':Person (10)' })).toHaveCount(1);
                await containerLocator(page).getByRole('button', { name: ':Person (10)' }).click();
                await expect(modalLocator(page)).toHaveScreenshot({
                    mask: [modalLocator(page).locator('input[type="color"]')],
                });
                await modalLocator(page).getByRole('button', { name: 'Close' }).last().click();
                await expect(modalLocator(page)).toHaveCount(0);
            });

            test('Hide and show sidebar', async ({ page }) => {
                await expect(containerLocator(page, '.sidebar')).toBeVisible();
                await containerLocator(page, '.sidebar-switch-btn').getByRole('button').click();
                await expect(containerLocator(page, '.sidebar')).toBeHidden();
                await containerLocator(page, '.sidebar-switch-btn').getByRole('button').click();
                await expect(containerLocator(page, '.sidebar')).toBeVisible();
            });
        });

        test('Summary', async ({ page }) => {
            await containerLocator(page).getByRole('button', { name: 'Summary' }).click();
            expect(JSON.parse(await containerLocator(page).getByText('queryType').textContent())).toBeTruthy();

            //copy test
            await containerLocator(page, 'div.control pre + .is-clickable').click();
            await expect(containerLocator(page).getByText('queryType')).toHaveText(
                await page.evaluate('navigator.clipboard.readText();')
            );
            await checkNotification(page);
        });
    });
});
