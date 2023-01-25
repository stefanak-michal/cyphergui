import * as React from "react";
import db from "../db";
import { Button, Checkbox } from "../components/form";
import Modal from "../components/Modal";
import { ISettings } from "../utils/interfaces";

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

        this.setState(state => {
            setSetting(target.name, value);
            return { settings: settings() };
        });
    };

    render() {
        return (
            <Modal
                title="Settings"
                icon="fa-solid fa-gears"
                handleClose={this.props.handleClose}
                buttons={<Button text="Close" icon="fa-solid fa-xmark" onClick={this.props.handleClose} color="is-secondary" />}>
                {db.hasElementId && (
                    <div className="mb-3">
                        <Checkbox
                            name="tableViewShowElementId"
                            onChange={this.handleChange}
                            label="Show elementId in table views"
                            checked={this.state.settings.tableViewShowElementId}
                            color="is-dark"
                        />
                    </div>
                )}
                <div className="mb-3">
                    <Checkbox
                        name="closeEditAfterExecuteSuccess"
                        onChange={this.handleChange}
                        label="Close create/edit tab after successful execute"
                        checked={this.state.settings.closeEditAfterExecuteSuccess}
                        color="is-dark"
                    />
                </div>
                <div className="mb-3">
                    <Checkbox
                        name="forceNamingRecommendations"
                        onChange={this.handleChange}
                        label="Force naming recommendations"
                        checked={this.state.settings.forceNamingRecommendations}
                        color="is-dark"
                        help="Node label PascalCase. Relationship type UPPERCASE."
                    />
                </div>
                <div className="field">
                    <label className="label">Method when printing out temporal values</label>
                    <div className="control">
                        <div className="select is-fullwidth">
                            <select name="temporalValueToStringFunction" value={this.state.settings.temporalValueToStringFunction} onChange={this.handleChange}>
                                {["toISOString", "toUTCString", "toJSON", "toString"].map(fn => (
                                    <option key={fn} value={fn}>
                                        {fn}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <p className="help">date, datetime</p>
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
        temporalValueToStringFunction: "toString",
        ...(localStorage.getItem("settings") ? JSON.parse(localStorage.getItem("settings")) : {}),
    };
}

export function setSetting(name: string, value: any) {
    let s = settings();
    s[name] = value;
    localStorage.setItem("settings", JSON.stringify(s));
}
