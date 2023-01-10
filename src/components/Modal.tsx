import * as React from "react";
import { Integer } from "neo4j-driver";
import { Button, Checkbox } from "./form";

export default class Modal extends React.Component<{ title: string; color?: string; handleClose: () => void; children: React.ReactNode; icon?: string }> {
    render() {
        return (
            <div className="modal is-active">
                <div className="modal-background"></div>
                <div className="modal-content">
                    <div className={"message " + (this.props.color || "")}>
                        <div className="message-header">
                            <p>
                                {this.props.icon && (
                                    <span className="icon mr-3">
                                        <i className={this.props.icon} />
                                    </span>
                                )}
                                {this.props.title}
                            </p>
                            <button className="delete" aria-label="delete" onClick={this.props.handleClose} />
                        </div>
                        <div className="message-body">{this.props.children}</div>
                    </div>
                </div>
            </div>
        );
    }
}

export class DeleteModal extends React.Component<
    { delete: Integer | string; detach?: boolean; handleConfirm: (id: Integer | string, detach: boolean) => void; handleClose: () => void },
    { detach: boolean }
> {
    state: { detach: boolean } = {
        detach: false,
    };

    handleConfirm = () => {
        this.props.handleConfirm(this.props.delete, this.state.detach);
        this.props.handleClose();
    };

    render() {
        return (
            <Modal title="Are you sure?" color="is-danger" handleClose={this.props.handleClose} icon="fa-solid fa-triangle-exclamation">
                {this.props.detach && (
                    <div className="mb-3">
                        <Checkbox
                            name="detachDelete"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                this.setState({
                                    detach: e.currentTarget.checked,
                                })
                            }
                            label="Detach delete?"
                            checked={this.state.detach}
                            color="is-danger"
                        />
                    </div>
                )}
                <div className="buttons is-justify-content-flex-end">
                    <Button text="Confirm" icon="fa-solid fa-check" onClick={this.handleConfirm} color="is-danger" />
                    <Button text="Cancel" icon="fa-solid fa-xmark" onClick={this.props.handleClose} color="is-secondary" />
                </div>
            </Modal>
        );
    }
}
