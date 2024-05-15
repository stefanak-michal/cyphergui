import { expect, test } from '../fixtures/neo4j-login';
import { checkActiveTab, checkNotification, containerLocator, modalLocator, switchToTab } from '../helpers';
import { Locator, Page } from '@playwright/test';

function propertyLocatorByKey(page: Page, key: string): Locator {
    return containerLocator(page)
        .getByRole('group', { name: 'Properties' })
        .locator('> .field')
        .filter({
            has: page.locator('input[value="' + key + '"]'),
        });
}

async function checkTableValue(page: Page, key: string, value: string, row: number = 0) {
    const index = await containerLocator(page, 'table thead th')
        .filter({ hasText: key })
        .evaluateAll(elements => {
            if (elements.length === 0) return -1;
            const parent = elements[0].parentElement;
            return Array.from(parent.children).indexOf(elements[0]);
        });
    if (index != -1)
        await expect(containerLocator(page, 'table tbody tr').nth(row).locator('td').nth(index)).toHaveText(value);
}

async function addProperties(page: Page) {
    const addPropertyBtn = containerLocator(page)
        .getByRole('group', { name: 'Properties' })
        .getByRole('button', { name: 'Add property' });
    const propertyLocator = containerLocator(page)
        .getByRole('group', { name: 'Properties' })
        .locator('> .field')
        .last();
    // string
    await addPropertyBtn.click();
    await expect(propertyLocator.getByPlaceholder('Key')).toHaveValue('');
    await propertyLocator.getByPlaceholder('Key').fill('key_string');
    await propertyLocator.getByPlaceholder('Value').fill('Some random value');
    // integer
    await addPropertyBtn.click();
    await expect(propertyLocator.getByPlaceholder('Key')).toHaveValue('');
    await propertyLocator.getByTitle('Property type').selectOption('Integer');
    await propertyLocator.getByPlaceholder('Key').fill('key_int');
    await propertyLocator.getByPlaceholder('Value').fill('123');
    // float
    await addPropertyBtn.click();
    await expect(propertyLocator.getByPlaceholder('Key')).toHaveValue('');
    await propertyLocator.getByTitle('Property type').selectOption('Float');
    await propertyLocator.getByPlaceholder('Key').fill('key_float');
    await propertyLocator.getByPlaceholder('Value').fill('456.789');
    // boolean
    await addPropertyBtn.click();
    await expect(propertyLocator.getByPlaceholder('Key')).toHaveValue('');
    await propertyLocator.getByTitle('Property type').selectOption('Boolean');
    await propertyLocator.getByPlaceholder('Key').fill('key_bool');
    await propertyLocator.locator('.switch span').click();
    // list
    await addPropertyBtn.click();
    await expect(propertyLocator.getByPlaceholder('Key')).toHaveValue('');
    await propertyLocator.getByTitle('Property type').selectOption('List');
    await propertyLocator.getByPlaceholder('Key').fill('key_list');
    await propertyLocator.getByPlaceholder('Value').fill('list value 1');
    await propertyLocator.getByTitle('Add list entry').click();
    await propertyLocator.getByPlaceholder('Value').last().fill('list value 2');
    // point 2D
    await addPropertyBtn.click();
    await expect(propertyLocator.getByPlaceholder('Key')).toHaveValue('');
    await propertyLocator.getByTitle('Property type').selectOption('Point');
    await propertyLocator.getByPlaceholder('Key').fill('key_point2d');
    await propertyLocator.getByTitle('X', { exact: true }).fill('28');
    await propertyLocator.getByTitle('Y', { exact: true }).fill('90');
    // point 3D
    await addPropertyBtn.click();
    await expect(propertyLocator.getByPlaceholder('Key')).toHaveValue('');
    await propertyLocator.getByTitle('Property type').selectOption('Point');
    await propertyLocator.getByTitle('SRID').selectOption('4979');
    await propertyLocator.getByPlaceholder('Key').fill('key_point3d');
    await propertyLocator.getByTitle('X', { exact: true }).fill('45');
    await propertyLocator.getByTitle('Y', { exact: true }).fill('67');
    await propertyLocator.getByTitle('Z', { exact: true }).fill('21');
    // date
    await addPropertyBtn.click();
    await expect(propertyLocator.getByPlaceholder('Key')).toHaveValue('');
    await propertyLocator.getByTitle('Property type').selectOption('Date');
    await propertyLocator.getByPlaceholder('Key').fill('key_date');
    await propertyLocator.getByTitle('Date', { exact: true }).fill('2024-03-03');
    // time
    await addPropertyBtn.click();
    await expect(propertyLocator.getByPlaceholder('Key')).toHaveValue('');
    await propertyLocator.getByTitle('Property type').selectOption('Time');
    await propertyLocator.getByPlaceholder('Key').fill('key_time');
    await propertyLocator.getByTitle('Time', { exact: true }).fill('10:24:36');
    await propertyLocator.getByTitle('Nanoseconds', { exact: true }).fill('100200300');
    await propertyLocator.getByTitle('Timezone', { exact: true }).selectOption('+02:00');
    // dateTime
    await addPropertyBtn.click();
    await expect(propertyLocator.getByPlaceholder('Key')).toHaveValue('');
    await propertyLocator.getByTitle('Property type').selectOption('DateTime');
    await propertyLocator.getByPlaceholder('Key').fill('key_dateTime');
    await propertyLocator.getByTitle('Date', { exact: true }).fill('1998-12-27');
    await propertyLocator.getByTitle('Time', { exact: true }).fill('18:44:12');
    await propertyLocator.getByTitle('Nanoseconds', { exact: true }).fill('300200100');
    await propertyLocator.getByTitle('Timezone', { exact: true }).selectOption('+02:00');
    // localTime
    await addPropertyBtn.click();
    await expect(propertyLocator.getByPlaceholder('Key')).toHaveValue('');
    await propertyLocator.getByTitle('Property type').selectOption('LocalTime');
    await propertyLocator.getByPlaceholder('Key').fill('key_localTime');
    await propertyLocator.getByTitle('Time', { exact: true }).fill('13:21:57');
    await propertyLocator.getByTitle('Nanoseconds', { exact: true }).fill('900800700');
    // localDateTime
    await addPropertyBtn.click();
    await expect(propertyLocator.getByPlaceholder('Key')).toHaveValue('');
    await propertyLocator.getByTitle('Property type').selectOption('LocalDateTime');
    await propertyLocator.getByPlaceholder('Key').fill('key_localDateTime');
    await propertyLocator.getByTitle('Date', { exact: true }).fill('1987-09-15');
    await propertyLocator.getByTitle('Time', { exact: true }).fill('16:48:35');
    await propertyLocator.getByTitle('Nanoseconds', { exact: true }).fill('700800900');
    // duration
    await addPropertyBtn.click();
    await expect(propertyLocator.getByPlaceholder('Key')).toHaveValue('');
    await propertyLocator.getByTitle('Property type').selectOption('Duration');
    await propertyLocator.getByPlaceholder('Key').fill('key_duration');
    await propertyLocator.getByTitle('Duration', { exact: true }).fill('P1Y2M3DT5H6M7S');
}

test.describe('Write flow', { tag: '@neo4j-write' }, () => {
    test.describe.configure({ mode: 'serial' });
    test.use({ viewport: { width: 1920, height: 1800 } });

    test('Run', async ({ page }) => {
        await test.step('Clean nodes first', async () => {
            await page.getByRole('button', { name: 'Query' }).click();
            await checkActiveTab(page, /Query#\d+/);

            await containerLocator(page, 'textarea[name="query"]').fill('MATCH (n:Test) DETACH DELETE n');
            await containerLocator(page).getByRole('button', { name: 'Execute' }).click();
            await containerLocator(page).getByRole('button', { name: 'Close' }).click();
            await checkActiveTab(page, 'Start');
        });

        await test.step('Create node 1', async () => {
            // we should be on Start tab
            await containerLocator(page).getByRole('button', { name: 'Create node' }).click();
            await checkActiveTab(page, /New node#\d+/);

            // label
            await containerLocator(page)
                .getByRole('group', { name: 'Labels' })
                .getByRole('button', { name: '+', exact: true })
                .click();
            await modalLocator(page).getByRole('textbox').fill('Test');
            await modalLocator(page).locator('button[type="submit"]').click();
            await expect(modalLocator(page)).toHaveCount(0);
            await expect(containerLocator(page).getByRole('group', { name: 'Labels' })).toContainText('Test');
            // add properties
            await addProperties(page);
            // check and save
            await containerLocator(page).getByRole('button', { name: 'Execute' }).click();
            await checkNotification(page, 'Node created');

            await containerLocator(page).getByRole('button', { name: ':Test' }).click();
            await checkActiveTab(page, 'Test');
            await expect(containerLocator(page, 'table tbody tr')).toHaveCount(1);

            await checkTableValue(page, 'key_string', 'Some random value');
            await checkTableValue(page, 'key_int', '123');
            await checkTableValue(page, 'key_list', '[list value 1, list value 2]');
            await checkTableValue(page, 'key_point2d', 'Point{srid=4326, x=28.0, y=90.0}');
            await checkTableValue(page, 'key_point3d', 'Point{srid=4979, x=45.0, y=67.0, z=21.0}');
            await checkTableValue(page, 'key_date', '2024-03-03');
            await checkTableValue(page, 'key_time', '10:24:36.100200300+02:00');
            await checkTableValue(page, 'key_dateTime', '1998-12-27T18:44:12.300200100+02:00');
            await checkTableValue(page, 'key_localTime', '13:21:57.900800700');
            await checkTableValue(page, 'key_localDateTime', '1987-09-15T16:48:35.700800900');
            await checkTableValue(page, 'key_duration', 'P14M3DT18367S');
        });

        await test.step('Edit node 1', async () => {
            // we should be on label Test tab
            await containerLocator(page, 'table tbody tr').first().getByRole('button', { name: /#\d+/ }).click();
            await checkActiveTab(page, /Node#\d+/);
            // edit some properties
            await propertyLocatorByKey(page, 'key_int').getByPlaceholder('Value').fill('54352');
            await propertyLocatorByKey(page, 'key_bool').locator('.switch span').click();
            // remove some properties
            await propertyLocatorByKey(page, 'key_duration').getByTitle('Delete property').click();
            await propertyLocatorByKey(page, 'key_time').getByTitle('Delete property').click();
            // check and save
            await containerLocator(page).getByRole('button', { name: 'Execute' }).click();
            await checkNotification(page, 'Node updated');
            await expect(containerLocator(page, 'table tbody tr')).toHaveCount(1);

            await checkTableValue(page, 'key_string', 'Some random value');
            await checkTableValue(page, 'key_int', '54352');
            await checkTableValue(page, 'key_list', '[list value 1, list value 2]');
            await checkTableValue(page, 'key_point2d', 'Point{srid=4326, x=28.0, y=90.0}');
            await checkTableValue(page, 'key_point3d', 'Point{srid=4979, x=45.0, y=67.0, z=21.0}');
            await checkTableValue(page, 'key_date', '2024-03-03');
            await checkTableValue(page, 'key_dateTime', '1998-12-27T18:44:12.300200100+02:00');
            await checkTableValue(page, 'key_localTime', '13:21:57.900800700');
            await checkTableValue(page, 'key_localDateTime', '1987-09-15T16:48:35.700800900');
        });

        await test.step('Create node 2', async () => {
            // we should be on label Test tab
            await containerLocator(page).getByRole('button', { name: 'Create node' }).click();
            // label should be prefilled
            await expect(containerLocator(page).getByRole('group', { name: 'Labels' })).toContainText('Test');
            // check and save
            await containerLocator(page).getByRole('button', { name: 'Execute' }).click();
            await checkNotification(page, 'Node created');
            await expect(containerLocator(page, 'table tbody tr')).toHaveCount(2);
        });

        await test.step('Create relationship 1', async () => {
            // we should be on label Test tab
            const id1: string = await containerLocator(page).getByRole('button', { name: /#\d+/ }).first().innerText();
            const id2: string = await containerLocator(page).getByRole('button', { name: /#\d+/ }).last().innerText();
            // create rel
            await switchToTab(page, 'Start');
            await containerLocator(page).getByRole('button', { name: 'Create relationship' }).click();
            await checkActiveTab(page, /New relationship#\d+/);
            // add type
            await containerLocator(page).getByRole('group', { name: 'Type' }).getByRole('button').click();
            await modalLocator(page).getByRole('textbox').fill('HAS');
            await modalLocator(page).locator('button[type="submit"]').click();
            await expect(modalLocator(page)).toHaveCount(0);
            await expect(containerLocator(page).getByRole('group', { name: 'Type' })).toContainText('HAS');
            // add properties
            await addProperties(page);
            // start node
            await containerLocator(page)
                .getByRole('group', { name: 'Start node' })
                .getByRole('button', { name: 'Change' })
                .click();
            await modalLocator(page).getByRole('textbox').fill(id1.substring(1));
            await modalLocator(page).locator('button[type="submit"]').click();
            await expect(modalLocator(page)).toHaveCount(0);
            // end node
            await containerLocator(page)
                .getByRole('group', { name: 'End node' })
                .getByRole('button', { name: 'Change' })
                .click();
            await modalLocator(page).getByRole('textbox').fill(id2.substring(1));
            await modalLocator(page).locator('button[type="submit"]').click();
            await expect(modalLocator(page)).toHaveCount(0);

            // check and save
            await containerLocator(page).getByRole('button', { name: 'Execute' }).click();
            await checkNotification(page, 'Relationship created');

            await switchToTab(page, 'Start');
            await containerLocator(page).getByRole('button', { name: ':HAS' }).click();
            await checkActiveTab(page, 'HAS');
            await expect(containerLocator(page, 'table tbody tr')).toHaveCount(1);

            await checkTableValue(page, 'key_string', 'Some random value');
            await checkTableValue(page, 'key_int', '123');
            await checkTableValue(page, 'key_list', '[list value 1, list value 2]');
            await checkTableValue(page, 'key_point2d', 'Point{srid=4326, x=28.0, y=90.0}');
            await checkTableValue(page, 'key_point3d', 'Point{srid=4979, x=45.0, y=67.0, z=21.0}');
            await checkTableValue(page, 'key_date', '2024-03-03');
            await checkTableValue(page, 'key_time', '10:24:36.100200300+02:00');
            await checkTableValue(page, 'key_dateTime', '1998-12-27T18:44:12.300200100+02:00');
            await checkTableValue(page, 'key_localTime', '13:21:57.900800700');
            await checkTableValue(page, 'key_localDateTime', '1987-09-15T16:48:35.700800900');
            await checkTableValue(page, 'key_duration', 'P14M3DT18367S');
        });

        await test.step('Update relationship 1', async () => {
            // we should be on type HAS tab
            await containerLocator(page).getByRole('button', { name: /#\d+/ }).first().click();
            await checkActiveTab(page, /Rel#\d+/);
            // edit some properties
            await propertyLocatorByKey(page, 'key_int').getByPlaceholder('Value').fill('54352');
            await propertyLocatorByKey(page, 'key_bool').locator('.switch span').click();
            // remove some properties
            await propertyLocatorByKey(page, 'key_duration').getByTitle('Delete property').click();
            await propertyLocatorByKey(page, 'key_time').getByTitle('Delete property').click();
            // check and save
            await containerLocator(page).getByRole('button', { name: 'Execute' }).click();
            await checkNotification(page, 'Relationship updated');

            await switchToTab(page, 'HAS');
            await expect(containerLocator(page, 'table tbody tr')).toHaveCount(1);

            await checkTableValue(page, 'key_string', 'Some random value');
            await checkTableValue(page, 'key_int', '54352');
            await checkTableValue(page, 'key_list', '[list value 1, list value 2]');
            await checkTableValue(page, 'key_point2d', 'Point{srid=4326, x=28.0, y=90.0}');
            await checkTableValue(page, 'key_point3d', 'Point{srid=4979, x=45.0, y=67.0, z=21.0}');
            await checkTableValue(page, 'key_date', '2024-03-03');
            await checkTableValue(page, 'key_dateTime', '1998-12-27T18:44:12.300200100+02:00');
            await checkTableValue(page, 'key_localTime', '13:21:57.900800700');
            await checkTableValue(page, 'key_localDateTime', '1987-09-15T16:48:35.700800900');
        });

        await test.step('Delete relationship 1', async () => {
            // we should be on type HAS tab
            await containerLocator(page).getByTitle('Delete').click();
            await expect(modalLocator(page)).toHaveScreenshot();
            await modalLocator(page).getByRole('button', { name: 'Confirm' }).click();
            await expect(modalLocator(page)).toHaveCount(0);
            await checkNotification(page, 'Relationship deleted');
            await expect(containerLocator(page).locator('table tbody tr')).toHaveCount(0);
        });

        await test.step('Create relationship 2', async () => {
            // get node ids
            await switchToTab(page, 'Test');
            const id1: string = await containerLocator(page).getByRole('button', { name: /#\d+/ }).first().innerText();
            const id2: string = await containerLocator(page).getByRole('button', { name: /#\d+/ }).last().innerText();
            // create rel
            await switchToTab(page, 'Start');
            await containerLocator(page).getByRole('button', { name: 'Create relationship' }).click();
            await checkActiveTab(page, /New relationship#\d+/);
            // add type
            await containerLocator(page).getByRole('group', { name: 'Type' }).getByRole('button').click();
            await modalLocator(page).getByRole('textbox').fill('HAS');
            await modalLocator(page).locator('button[type="submit"]').click();
            await expect(modalLocator(page)).toHaveCount(0);
            await expect(containerLocator(page).getByRole('group', { name: 'Type' })).toContainText('HAS');
            // start node
            await containerLocator(page)
                .getByRole('group', { name: 'Start node' })
                .getByRole('button', { name: 'Change' })
                .click();
            await modalLocator(page).getByRole('textbox').fill(id1.substring(1));
            await modalLocator(page).locator('button[type="submit"]').click();
            await expect(modalLocator(page)).toHaveCount(0);
            // end node
            await containerLocator(page)
                .getByRole('group', { name: 'End node' })
                .getByRole('button', { name: 'Change' })
                .click();
            await modalLocator(page).getByRole('textbox').fill(id2.substring(1));
            await modalLocator(page).locator('button[type="submit"]').click();
            await expect(modalLocator(page)).toHaveCount(0);

            // check and save
            await containerLocator(page).getByRole('button', { name: 'Execute' }).click();
            await checkNotification(page, 'Relationship created');

            await switchToTab(page, 'Start');
            await containerLocator(page).getByRole('button', { name: ':HAS' }).click();
            await checkActiveTab(page, 'HAS');
            await expect(containerLocator(page, 'table tbody tr')).toHaveCount(1);
        });

        await test.step('Delete node 1', async () => {
            await switchToTab(page, 'Test');
            await containerLocator(page).getByTitle('Delete').first().click();
            await expect(modalLocator(page)).toHaveScreenshot();
            await modalLocator(page).getByText('Detach delete?').click();
            await modalLocator(page).getByRole('button', { name: 'Confirm' }).click();
            await expect(modalLocator(page)).toHaveCount(0);
            await checkNotification(page, 'Node deleted');
        });

        await test.step('Delete node 2', async () => {
            // we should be on label Test tab
            await containerLocator(page).getByTitle('Delete').first().click();
            await expect(modalLocator(page)).toHaveScreenshot();
            await modalLocator(page).getByRole('button', { name: 'Confirm' }).click();
            await expect(modalLocator(page)).toHaveCount(0);
            await checkNotification(page, 'Node deleted');
        });
    });
});
