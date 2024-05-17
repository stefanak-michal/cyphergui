import { test, expect } from '../fixtures/neo4j-movies';
import { checkActiveTab, checkNotification, containerLocator } from '../helpers';

test.describe('History tab', { tag: '@neo4j-read' }, () => {
    test.beforeEach('Go to', async ({ page }) => {
        await page.getByTitle('Open history').click();
        await checkActiveTab(page, 'History');
    });

    test('Visual check', async ({ page }) => {
        await expect(containerLocator(page, 'table tbody').getByRole('cell', { name: 'S', exact: true })).toHaveCount(
            5
        );
        await expect(containerLocator(page, 'table tbody').getByRole('cell', { name: '{}' })).toHaveCount(5);
        await expect(containerLocator(page, 'table tbody').getByTitle('Open in query tab')).toHaveCount(5);
        await expect(containerLocator(page, 'table tbody')).toContainText('SHOW DATABASES');
        await expect(containerLocator(page, 'table tbody')).toContainText(
            'MATCH (n) WITH DISTINCT labels(n) AS ll UNWIND ll AS l RETURN collect(DISTINCT l) AS c'
        );
        await expect(containerLocator(page, 'table tbody')).toContainText(
            'MATCH ()-[n]-() RETURN collect(DISTINCT type(n)) AS c'
        );
        await expect(containerLocator(page, 'table tbody')).toContainText(
            'MATCH (n) WITH DISTINCT labels(n) AS ll UNWIND ll AS l RETURN collect(DISTINCT l) AS c'
        );
        await expect(containerLocator(page, 'table tbody')).toContainText(
            'MATCH ()-[n]-() RETURN collect(DISTINCT type(n)) AS c'
        );
    });

    test('Open query', async ({ page }) => {
        await containerLocator(page).getByTitle('Open in query tab').first().click();
        await checkActiveTab(page, /Query#\d+/);
    });

    test('Copy query', async ({ page }) => {
        await containerLocator(page)
            .getByText(/^MATCH \(\)/)
            .first()
            .click();
        await expect(
            containerLocator(page)
                .getByText(/^MATCH \(\)/)
                .first()
        ).toHaveText(await page.evaluate('navigator.clipboard.readText();'));
        await checkNotification(page);
    });

    test('Copy parameters', async ({ page }) => {
        await containerLocator(page).getByRole('cell', { name: '{}' }).first().locator('.is-clickable').click();
        expect(await page.evaluate('navigator.clipboard.readText();')).toMatch('{}');
        await checkNotification(page);
    });
});
