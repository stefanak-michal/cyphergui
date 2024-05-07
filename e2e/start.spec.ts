import { test, expect } from "./fixtures/login";
import { containerLocator } from './helpers';

test('Start', async ({ page }) => {
    await page.locator('.tabs a', { hasText: 'Start' }).click();
    page.locator('.container > div').locator('visible=true');
    await expect(containerLocator(page, 'button.is-link')).toContainText(['*', ':Person', ':Movie']);
    await expect(containerLocator(page, 'button.is-info')).toContainText([
        '*',
        ':ACTED_IN',
        ':DIRECTED',
        ':PRODUCED',
        ':WROTE',
        ':FOLLOWS',
        ':REVIEWED',
    ]);
    await expect(containerLocator(page, 'button.is-primary')).toContainText([
        'Create node',
        'Create relationship',
    ]);
});
