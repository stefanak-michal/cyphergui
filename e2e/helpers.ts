import { Page, expect } from '@playwright/test';

export function containerLocator(page: Page, selector: string = '') {
    const l = page.locator('.container > div').locator('visible=true');
    return selector ? l.locator(selector) : l;
}

export function modalLocator(page: Page) {
    return page.locator('.modal .modal-card').locator('visible=true');
}

export async function checkActiveTab(page: Page, text: string | RegExp) {
    await expect(page.locator('.tabs .is-active')).toHaveText(text);
}

export async function switchToTab(page: Page, text: string | RegExp) {
    await page.locator('.tabs a', { hasText: text }).click();
}

export async function checkErrorMessage(page: Page, text: string) {
    await expect(containerLocator(page)).toContainText(text);
    await containerLocator(page, '.message').getByRole('button').click();
    await expect(containerLocator(page, '.message')).toHaveCount(0);
}

export async function checkNotification(page: Page, text: string | RegExp = 'Copied to clipboard') {
    await expect(page.getByRole('region', { name: 'notifications' })).toHaveText(text);
    await page.getByRole('region', { name: 'notifications' }).getByRole('button').click();
    await expect(page.getByRole('region', { name: 'notifications' })).toBeEmpty();
}
