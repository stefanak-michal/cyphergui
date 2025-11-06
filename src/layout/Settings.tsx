import { useState, useContext } from 'react';
import db from '../db';
import { Button, Checkbox } from '../components/form';
import Modal from '../components/Modal';
import { ISettings } from '../utils/interfaces';
import { ThemeSwitchContext } from '../utils/contexts';

const Settings: React.FC<{ handleClose: () => void }> = ({ handleClose }) => {
    const [_settings, setSettings] = useState<ISettings>(settings());
    const themeSwitch = useContext(ThemeSwitchContext);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const target = e.currentTarget;
        const value = target instanceof HTMLInputElement ? target.checked : target.value;
        setSetting(target.name, value);
        setSettings(settings());
    };

    return (
        <Modal
            title='Settings'
            icon='fa-solid fa-gears'
            handleClose={handleClose}
            buttons={<Button text='Close' icon='fa-solid fa-xmark' onClick={handleClose} />}
        >
            {db.hasElementId && (
                <div className='mb-3'>
                    <Checkbox
                        name='tableViewShowElementId'
                        onChange={handleChange}
                        label='Show elementId in table views'
                        checked={_settings.tableViewShowElementId}
                        color='is-link'
                    />
                </div>
            )}
            <div className='mb-3'>
                <Checkbox
                    name='closeEditAfterExecuteSuccess'
                    onChange={handleChange}
                    label='Close create/edit tab after successful execute'
                    checked={_settings.closeEditAfterExecuteSuccess}
                    color='is-link'
                />
            </div>
            <div className='mb-3'>
                <Checkbox
                    name='forceNamingRecommendations'
                    onChange={handleChange}
                    label='Force naming recommendations'
                    checked={_settings.forceNamingRecommendations}
                    color='is-link'
                    help='Node label PascalCase. Relationship type UPPERCASE.'
                />
            </div>
            <div className='mb-3'>
                <Checkbox
                    name='confirmCloseUnsavedChanges'
                    onChange={handleChange}
                    label='Confirm dialog when closing tab with unsaved changes'
                    checked={_settings.confirmCloseUnsavedChanges}
                    color='is-link'
                />
            </div>
            <div className='mb-3'>
                <Checkbox
                    name='darkMode'
                    onChange={e => {
                        themeSwitch();
                        handleChange(e as React.ChangeEvent<HTMLInputElement>);
                    }}
                    label='Dark mode'
                    checked={_settings.darkMode}
                    color='is-link'
                />
            </div>
            <div className='mb-3'>
                <Checkbox
                    name='rememberOpenTabs'
                    onChange={handleChange}
                    label='Remember open tabs'
                    checked={_settings.rememberOpenTabs}
                    color='is-link'
                    help='After successful login app will try open remembered tabs.'
                />
            </div>
            <div className='mb-3'>
                <Checkbox
                    name='autoPopulateProperties'
                    onChange={handleChange}
                    label='Auto-populate properties when creating nodes/relationships'
                    checked={_settings.autoPopulateProperties}
                    color='is-link'
                    help='When selecting an existing label or type, automatically add property fields based on existing data.'
                />
            </div>
            <div className='field'>
                <label className='label'>Method when printing out temporal values</label>
                <div className='control'>
                    <div className='select is-fullwidth'>
                        <select
                            name='temporalValueToStringFunction'
                            value={_settings.temporalValueToStringFunction}
                            onChange={handleChange}
                        >
                            {['toISOString', 'toUTCString', 'toJSON', 'toString'].map(fn => (
                                <option key={fn} value={fn}>
                                    {fn}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <p className='help'>date, datetime</p>
            </div>
        </Modal>
    );
};

export default Settings;

export function settings(): ISettings {
    return {
        tableViewShowElementId: true,
        closeEditAfterExecuteSuccess: true,
        forceNamingRecommendations: true,
        temporalValueToStringFunction: 'toString',
        darkMode: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches,
        confirmCloseUnsavedChanges: true,
        rememberOpenTabs: true,
        autoPopulateProperties: true,
        ...(localStorage.getItem('settings') ? JSON.parse(localStorage.getItem('settings')) : {}),
    };
}

export function setSetting(name: string, value: any) {
    const s = settings();
    s[name] = value;
    localStorage.setItem('settings', JSON.stringify(s));
}
