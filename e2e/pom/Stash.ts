import { expect, Locator, Page } from '@playwright/test';

export default class Stash {
    constructor(private readonly page: Page) {}

    private async isOpen() {
        return (await this.page.locator('.stash').getAttribute('class')).includes('is-active');
    }

    async open() {
        if (!(await this.isOpen())) await this.page.locator('.stash > .panel-heading').click();
        await expect(this.page.locator('.stash > .panel-body')).toBeInViewport();
    }

    async close() {
        if (await this.isOpen()) await this.page.locator('.stash > .panel-heading').click();
        await expect(this.page.locator('.stash > .panel-body')).not.toBeInViewport();
    }

    async checkEntry(text: string | RegExp, expectedAmount: number = 1) {
        const open = await this.isOpen();
        if (!open) await this.open();
        await expect(this.page.locator('.stash .panel-block').getByText(text)).toHaveCount(expectedAmount);
        if (!open) await this.close();
    }

    getEntryLocator(text: string): Locator {
        return this.page.locator('.stash .panel-block').filter({ hasText: text });
    }
}
