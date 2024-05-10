import { expect, test as base } from './login';
import { containerLocator } from '../helpers';

export const test = base.extend({
    page: async ({ page }, use) => {
        await page.locator('.tabs a', { hasText: 'Start' }).click();
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
        await expect(containerLocator(page, 'button.is-primary')).toContainText(['Create node', 'Create relationship']);

        await use(page);
    },
});

export { expect };
