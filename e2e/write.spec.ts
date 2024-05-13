import { expect, test } from './fixtures/login';
import { checkActiveTab, checkNotification, containerLocator, modalLocator, switchToTab } from './helpers';

test.describe('Write flow', { tag: '@read-write' }, () => {
    test.describe.configure({ mode: 'serial' });

    test('Create node 1', async ({ page }) => {
        await switchToTab(page, 'Start');
        await containerLocator(page).getByRole('button', { name: 'Create node' }).click();
        await checkActiveTab(page, /New node#\d+/);

        // label
        await containerLocator(page)
            .getByRole('group', { name: 'Labels' })
            .getByRole('button', { name: '+', exact: true })
            .click();
        await modalLocator(page).getByRole('textbox').fill('Test');
        await modalLocator(page).locator('button[type="submit"]').click();
        await expect(containerLocator(page).getByRole('group', { name: 'Labels' })).toHaveScreenshot();

        /*
        Add all types of properties
         */
        const addPropertyBtn = containerLocator(page)
            .getByRole('group', { name: 'Properties' })
            .getByRole('button', { name: 'Add property' });
        const propertyLocator = containerLocator(page)
            .getByRole('group', { name: 'Properties' })
            .locator('> .field')
            .last();
        // string
        await addPropertyBtn.click();
        await propertyLocator.getByPlaceholder('Key').fill('key_string');
        await propertyLocator.getByPlaceholder('Value').fill('Some random value');
        // integer
        await addPropertyBtn.click();
        await propertyLocator.getByTitle('Property type').selectOption('Integer');
        await propertyLocator.getByPlaceholder('Key').fill('key_int');
        await propertyLocator.getByPlaceholder('Value').fill('123');
        // float
        await addPropertyBtn.click();
        await propertyLocator.getByTitle('Property type').selectOption('Float');
        await propertyLocator.getByPlaceholder('Key').fill('key_float');
        await propertyLocator.getByPlaceholder('Value').fill('456.789');
        // boolean
        await addPropertyBtn.click();
        await propertyLocator.getByTitle('Property type').selectOption('Boolean');
        await propertyLocator.getByPlaceholder('Key').fill('key_bool');
        await propertyLocator.locator('.switch span').click();
        // list
        await addPropertyBtn.click();
        await propertyLocator.getByTitle('Property type').selectOption('List');
        await propertyLocator.getByPlaceholder('Key').fill('key_list');
        await propertyLocator.getByPlaceholder('Value').fill('list value 1');
        await propertyLocator.getByTitle('Add list entry').click();
        await propertyLocator.getByPlaceholder('Value').last().fill('list value 2');
        // point 2D
        await addPropertyBtn.click();
        await propertyLocator.getByTitle('Property type').selectOption('Point');
        await propertyLocator.getByPlaceholder('Key').fill('key_point2d');
        await propertyLocator.getByTitle('X', { exact: true }).fill('28');
        await propertyLocator.getByTitle('Y', { exact: true }).fill('90');
        // point 3D
        await addPropertyBtn.click();
        await propertyLocator.getByTitle('Property type').selectOption('Point');
        await propertyLocator.getByTitle('SRID').selectOption('4979');
        await propertyLocator.getByPlaceholder('Key').fill('key_point3d');
        await propertyLocator.getByTitle('X', { exact: true }).fill('45');
        await propertyLocator.getByTitle('Y', { exact: true }).fill('67');
        await propertyLocator.getByTitle('Z', { exact: true }).fill('21');
        // date
        await addPropertyBtn.click();
        await propertyLocator.getByTitle('Property type').selectOption('Date');
        await propertyLocator.getByPlaceholder('Key').fill('key_date');
        await propertyLocator.getByTitle('Date', { exact: true }).fill('2024-03-03');
        // time
        await addPropertyBtn.click();
        await propertyLocator.getByTitle('Property type').selectOption('Time');
        await propertyLocator.getByPlaceholder('Key').fill('key_time');
        await propertyLocator.getByTitle('Time', { exact: true }).fill('10:24:36');
        await propertyLocator.getByTitle('Nanoseconds', { exact: true }).fill('100200300');
        await propertyLocator.getByTitle('Timezone', { exact: true }).selectOption('+02:00');
        // dateTime
        await addPropertyBtn.click();
        await propertyLocator.getByTitle('Property type').selectOption('DateTime');
        await propertyLocator.getByPlaceholder('Key').fill('key_dateTime');
        await propertyLocator.getByTitle('Date', { exact: true }).fill('1998-12-27');
        await propertyLocator.getByTitle('Time', { exact: true }).fill('18:44:12');
        await propertyLocator.getByTitle('Nanoseconds', { exact: true }).fill('300200100');
        await propertyLocator.getByTitle('Timezone', { exact: true }).selectOption('+02:00');
        // localTime
        await addPropertyBtn.click();
        await propertyLocator.getByTitle('Property type').selectOption('LocalTime');
        await propertyLocator.getByPlaceholder('Key').fill('key_localTime');
        await propertyLocator.getByTitle('Time', { exact: true }).fill('13:21:57');
        await propertyLocator.getByTitle('Nanoseconds', { exact: true }).fill('900800700');
        // localDateTime
        await addPropertyBtn.click();
        await propertyLocator.getByTitle('Property type').selectOption('LocalDateTime');
        await propertyLocator.getByPlaceholder('Key').fill('key_localDateTime');
        await propertyLocator.getByTitle('Date', { exact: true }).fill('1987-09-15');
        await propertyLocator.getByTitle('Time', { exact: true }).fill('16:48:35');
        await propertyLocator.getByTitle('Nanoseconds', { exact: true }).fill('700800900');
        // duration
        await addPropertyBtn.click();
        await propertyLocator.getByTitle('Property type').selectOption('Duration');
        await propertyLocator.getByPlaceholder('Key').fill('key_duration');
        await propertyLocator.getByTitle('Duration', { exact: true }).fill('P1Y2M3DT5H6M7S');

        // check and save
        await expect(containerLocator(page).getByRole('group', { name: 'Properties' })).toHaveScreenshot();
        await containerLocator(page).getByRole('button', { name: 'Execute' }).click();
        await checkNotification(page, 'Node created');
    });

    test('Edit node 1', async ({ page }) => {
        // hide elementId
        await page.getByTitle('Open settings').click();
        await modalLocator(page).getByText('Show elementId in table views').click();
        await modalLocator(page).getByRole('button', { name: 'Close' }).last().click();
        // open edit node 1
        await switchToTab(page, 'Start');
        await containerLocator(page).getByRole('button', { name: ':Test' }).click();
        await checkActiveTab(page, 'Test');

    });
    test('Create node 2', async ({ page }) => {});
    test('Create relationship 1', async ({ page }) => {});
    test('Update relationship 1', async ({ page }) => {});
    test('Delete relationship 1', async ({ page }) => {});
    test('Create relationship 2', async ({ page }) => {});
    test('Delete node 1', async ({ page }) => {});
    test('Delete node 2', async ({ page }) => {});

});
