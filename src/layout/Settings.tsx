import * as React from "react";
import db from "../db";
import { Button, Checkbox } from "../components/form";
import Modal from "../components/Modal";
import { ISettings } from "../utils/interfaces";

class Settings extends React.Component<{ settings: ISettings; handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void; handleClose: () => void }> {
    render() {
        return (
            <Modal title="Settings" handleClose={this.props.handleClose}>
                {db.hasElementId && (
                    <div className="mb-3">
                        <Checkbox
                            name="tableViewShowElementId"
                            onChange={this.props.handleChange}
                            label="Show elementId in table views"
                            checked={this.props.settings.tableViewShowElementId}
                            color="is-dark"
                        />
                    </div>
                )}
                <div className="mb-3">
                    <Checkbox
                        name="closeEditAfterExecuteSuccess"
                        onChange={this.props.handleChange}
                        label="Close create/edit tab after successful execute"
                        checked={this.props.settings.closeEditAfterExecuteSuccess}
                        color="is-dark"
                    />
                </div>
                <div className="mb-3">
                    <Checkbox
                        name="forceNamingRecommendations"
                        onChange={this.props.handleChange}
                        label="Force naming recommendations"
                        checked={this.props.settings.forceNamingRecommendations}
                        color="is-dark"
                        help="Node label PascalCase. Relationship type UPPERCASE."
                    />
                </div>
                <div className="buttons is-justify-content-flex-end">
                    <Button text="Close" icon="fa-solid fa-xmark" onClick={this.props.handleClose} color="is-secondary" />
                </div>
            </Modal>
        );
    }
}

export default Settings;
