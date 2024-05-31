import * as React from 'react';
import db from '../db';
import { Button, Checkbox } from '../components/form';
import Modal from '../components/Modal';
import { ISettings } from '../utils/interfaces';
import { ThemeSwitchContext } from '../utils/contexts';

interface ISettingsState {
    settings: ISettings;
}

class Settings extends React.Component<{ handleClose: () => void }, ISettingsState> {
    state: ISettingsState = {
        settings: settings(),
    };

    handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const target = e.currentTarget;
        const value = target instanceof HTMLInputElement ? target.checked : target.value;
        this.setState(() => {
            setSetting(target.name, value);
            return { settings: settings() };
        });
    };

    render() {
        return (
            <Modal
                title='Settings'
                icon='fa-solid fa-gears'
                handleClose={this.props.handleClose}
                buttons={<Button text='Close' icon='fa-solid fa-xmark' onClick={this.props.handleClose} />}
            >
                {db.hasElementId && (
                    <div className='mb-3'>
                        <Checkbox
                            name='tableViewShowElementId'
                            onChange={this.handleChange}
                            label='Show elementId in table views'
                            checked={this.state.settings.tableViewShowElementId}
                            color='is-link'
                        />
                    </div>
                )}
                <div className='mb-3'>
                    <Checkbox
                        name='closeEditAfterExecuteSuccess'
                        onChange={this.handleChange}
                        label='Close create/edit tab after successful execute'
                        checked={this.state.settings.closeEditAfterExecuteSuccess}
                        color='is-link'
                    />
                </div>
                <div className='mb-3'>
                    <Checkbox
                        name='forceNamingRecommendations'
                        onChange={this.handleChange}
                        label='Force naming recommendations'
                        checked={this.state.settings.forceNamingRecommendations}
                        color='is-link'
                        help='Node label PascalCase. Relationship type UPPERCASE.'
                    />
                </div>
                <div className='mb-3'>
                    <Checkbox
                        name='confirmCloseUnsavedChanges'
                        onChange={this.handleChange}
                        label='Confirm dialog when closing tab with unsaved changes'
                        checked={this.state.settings.confirmCloseUnsavedChanges}
                        color='is-link'
                    />
                </div>
                <div className='mb-3'>
                    <ThemeSwitchContext.Consumer>
                        {themeSwitch => (
                            <Checkbox
                                name='darkMode'
                                onChange={e => {
                                    themeSwitch();
                                    this.handleChange(e as React.ChangeEvent<HTMLInputElement>);
                                }}
                                label='Dark mode'
                                checked={this.state.settings.darkMode}
                                color='is-link'
                            />
                        )}
                    </ThemeSwitchContext.Consumer>
                </div>
                <div className='mb-3'>
                    <Checkbox
                        name='rememberOpenTabs'
                        onChange={this.handleChange}
                        label='Remember open tabs'
                        checked={this.state.settings.rememberOpenTabs}
                        color='is-link'
                        help='After successful login app will try open remembered tabs.'
                    />
                </div>
                <div className='field'>
                    <label className='label'>Method when printing out temporal values</label>
                    <div className='control'>
                        <div className='select is-fullwidth'>
                            <select
                                name='temporalValueToStringFunction'
                                value={this.state.settings.temporalValueToStringFunction}
                                onChange={this.handleChange}
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
    }
}

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
        ...(localStorage.getItem('settings') ? JSON.parse(localStorage.getItem('settings')) : {}),
    };
}

export function setSetting(name: string, value: any) {
    const s = settings();
    s[name] = value;
    localStorage.setItem('settings', JSON.stringify(s));
}
