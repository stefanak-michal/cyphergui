import { Page, expect } from '@playwright/test';
// import { expect } from './fixtures/login';

export function containerLocator(page: Page, selector: string = '') {
    const l = page.locator('.container > div').locator('visible=true');
    return selector ? l.locator(selector) : l;
}

export function checkActiveTab(page: Page, text: string | RegExp) {
    return expect(page.locator('.tabs .is-active')).toHaveText(text);
}

export async function checkErrorMessage(page: Page, text: string) {
    await expect(containerLocator(page)).toContainText(text);
    await containerLocator(page, '.message').getByRole('button').click();
    await expect(containerLocator(page, '.message')).toHaveCount(0);
}
