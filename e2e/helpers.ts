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

export async function checkErrorMessage(page: Page, text: string) {
    await expect(containerLocator(page)).toContainText(text);
    await containerLocator(page, '.message').getByRole('button').click();
    await expect(containerLocator(page, '.message')).toHaveCount(0);
}

export async function checkStashEntry(page: Page, labelType: string, id: string, expectedAmount: number = 1) {
    if (labelType[0] !== ':') labelType = ':' + labelType;
    if (id[0] !== '#') id = '#' + id;
    await page.locator('.stash > .panel-heading').click();
    await expect(page.locator('.stash > .panel-body')).toBeInViewport();
    await expect(page.locator('.stash .panel-block').getByText(labelType + id)).toHaveCount(expectedAmount);
    await page.locator('.stash > .panel-heading').click();
    await expect(page.locator('.stash > .panel-body')).not.toBeInViewport();
}
