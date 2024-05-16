import { expect, test as base } from './login';
import { containerLocator, switchToTab } from '../helpers';

export const test = base.extend({
    page: async ({ page }, use) => {
        await switchToTab(page, 'Start');
        await expect(containerLocator(page, 'button.is-link').filter({ hasText: '*' })).toHaveCount(1);
        await expect(containerLocator(page, 'button.is-link').filter({ hasText: ':Person' })).toHaveCount(1);
        await expect(containerLocator(page, 'button.is-link').filter({ hasText: ':Movie' })).toHaveCount(1);

        await expect(containerLocator(page, 'button.is-info').filter({ hasText: '*' })).toHaveCount(1);
        await expect(containerLocator(page, 'button.is-info').filter({ hasText: ':ACTED_IN' })).toHaveCount(1);
        await expect(containerLocator(page, 'button.is-info').filter({ hasText: ':DIRECTED' })).toHaveCount(1);
        await expect(containerLocator(page, 'button.is-info').filter({ hasText: ':PRODUCED' })).toHaveCount(1);
        await expect(containerLocator(page, 'button.is-info').filter({ hasText: ':WROTE' })).toHaveCount(1);
        await expect(containerLocator(page, 'button.is-info').filter({ hasText: ':FOLLOWS' })).toHaveCount(1);
        await expect(containerLocator(page, 'button.is-info').filter({ hasText: ':REVIEWED' })).toHaveCount(1);

        await expect(containerLocator(page, 'button.is-primary')).toContainText(['Create node', 'Create relationship']);

        await use(page);
    },
});

export { expect };
