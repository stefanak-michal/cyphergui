import { test, expect } from '../fixtures/login';
import { checkActiveTab, checkNotification, containerLocator, modalLocator, switchToTab } from '../helpers';

test.describe('Multi database', { tag: '@neo4j-multidb' }, () => {
    test('Flow', async ({ page }) => {
        await test.step('Create database', async () => {
            await page.getByRole('button', { name: 'Query' }).click();
            await checkActiveTab(page, /Query#\d+/);
            await containerLocator(page, 'textarea[name="query"]').fill('CREATE DATABASE people');
            await containerLocator(page).getByRole('button', { name: 'Execute' }).click();
        });

        await test.step('Switch to new database', async () => {
            await page.locator('#basicNavbar .navbar-item.has-dropdown').first().hover();
            await expect(page.locator('#basicNavbar .navbar-item.has-dropdown > .navbar-dropdown')).toHaveText(
                'neo4jpeople'
            );
            await page.locator('#basicNavbar .navbar-item.has-dropdown > .navbar-dropdown').getByText('people').click();
            await expect(page.locator('#basicNavbar .navbar-item.has-dropdown > .navbar-link')).toHaveText('people');
        });

        await test.step('Create node in database', async () => {
            await switchToTab(page, 'Start');
            await containerLocator(page).getByRole('button', { name: 'Create node' }).click();
            await checkActiveTab(page, /New node#\d+/);

            // label
            await containerLocator(page)
                .getByRole('group', { name: 'Labels' })
                .getByRole('button', { name: '+', exact: true })
                .click();
            await modalLocator(page).getByRole('textbox').fill('Person');
            await modalLocator(page).locator('button[type="submit"]').click();
            await expect(modalLocator(page)).toHaveCount(0);
            await expect(containerLocator(page).getByRole('group', { name: 'Labels' })).toContainText('Person');

            // check and save
            await containerLocator(page).getByRole('button', { name: 'Execute' }).click();
            await checkNotification(page, 'Node created');
        });

        await test.step('Check labels towards databases', async () => {
            await switchToTab(page, 'Start');
            await expect(containerLocator(page).getByRole('button', { name: '*' })).toHaveCount(1);
            await expect(containerLocator(page).getByRole('button', { name: ':Person' })).toHaveCount(1);

            await page.locator('#basicNavbar .navbar-item.has-dropdown').first().hover();
            await page.locator('#basicNavbar .navbar-item.has-dropdown > .navbar-dropdown').getByText('neo4j').click();
            await expect(page.locator('#basicNavbar .navbar-item.has-dropdown > .navbar-link')).toHaveText('neo4j');

            await expect(containerLocator(page).getByRole('button', { name: '*' })).toHaveCount(0);
            await expect(containerLocator(page).getByRole('button', { name: ':Person' })).toHaveCount(0);
        });

        await test.step('Drop database', async () => {
            await switchToTab(page, /Query#\d+/);
            await containerLocator(page, 'textarea[name="query"]').fill('DROP DATABASE people');
            await containerLocator(page).getByRole('button', { name: 'Execute' }).click();
            await expect(page.locator('#basicNavbar .navbar-item.has-dropdown')).toHaveCount(0);
        });
    });
});
