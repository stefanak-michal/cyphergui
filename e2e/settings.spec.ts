import { test, expect } from './fixtures/read-only';
import { checkActiveTab, checkNotification, containerLocator, modalLocator } from './helpers';
import { Page } from '@playwright/test';

async function changeSettingAndClose(page: Page, title: string) {
    await modalLocator(page).getByText(title).click();
    await expect(modalLocator(page)).toHaveScreenshot();
    await modalLocator(page).getByRole('button', { name: 'Close' }).last().click();
    await expect(modalLocator(page)).toHaveCount(0);
}

test.describe('Settings', { tag: '@read-only' }, () => {
    test.beforeEach('Open settings modal', async ({ page }) => {
        await page.getByTitle('Open settings').click();
    });

    test('Show elementId', async ({ page }) => {
        await changeSettingAndClose(page, 'Show elementId in table views');
        // open any table view
        await page.locator('.tabs a', { hasText: 'Start' }).click();
        await containerLocator(page).getByRole('button', { name: '*' }).first().click();
        await checkActiveTab(page, '*');
        // check visually
        await expect(containerLocator(page)).toHaveScreenshot({
            mask: [
                //hide only ids
                containerLocator(page, 'table tbody')
                    .getByRole('button')
                    .getByText(/^#\d+$/),
            ],
        });
    });

    test('Close tab after execute', async ({ page }) => {
        await changeSettingAndClose(page, 'Close create/edit tab after successful execute');
        // open any table view
        await page.locator('.tabs a', { hasText: 'Start' }).click();
        await containerLocator(page).getByRole('button', { name: '*' }).first().click();
        await checkActiveTab(page, '*');
        // open any edit tab
        await containerLocator(page, 'table tbody').getByRole('button', { name: /#\d+/ }).first().click();
        // execute and check
        await containerLocator(page).getByRole('button', { name: 'Execute' }).click();
        await checkNotification(page, 'Node updated');
        await checkActiveTab(page, /Node#\d+/);
    });

    test('Force naming recommendations', async ({ page }) => {
        await changeSettingAndClose(page, 'Force naming recommendations');
        // open any table view
        await page.locator('.tabs a', { hasText: 'Start' }).click();
        await containerLocator(page).getByRole('button', { name: '*' }).first().click();
        await checkActiveTab(page, '*');
        // open any edit tab
        await containerLocator(page, 'table tbody').getByRole('button', { name: /#\d+/ }).first().click();
        // value without following recommendations
        await containerLocator(page)
            .getByRole('group', { name: 'Labels' })
            .getByRole('button', { name: '+', exact: true })
            .click();
        await modalLocator(page).getByRole('textbox').fill('test');
        await expect(modalLocator(page).getByRole('textbox')).toHaveValue('test');
    });

    test('Confirm dialog when unsaved changes', async ({ page }) => {
        await changeSettingAndClose(page, 'Confirm dialog when closing tab with unsaved changes');
        // open any table view
        await page.locator('.tabs a', { hasText: 'Start' }).click();
        await containerLocator(page).getByRole('button', { name: '*' }).first().click();
        await checkActiveTab(page, '*');
        // open any edit tab
        await containerLocator(page, 'table tbody').getByRole('button', { name: /#\d+/ }).first().click();
        // change anything and close
        await containerLocator(page)
            .getByRole('group', { name: 'Properties' })
            .getByRole('textbox')
            .first()
            .fill('Any value');
        await containerLocator(page).getByRole('button', { name: 'Close' }).click();
        await checkActiveTab(page, '*');
    });

    test.describe('Change resolution', () => {
        test.use({ viewport: { width: 1280, height: 800 } });

        test('Dark mode', async ({ page }) => {
            await changeSettingAndClose(page, 'Dark mode');
            // check visually
            await expect(containerLocator(page)).toHaveScreenshot();
        });
    });
});
