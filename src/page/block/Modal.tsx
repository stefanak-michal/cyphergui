import * as React from "react";
import { Button, Checkbox } from "../../form";
import { Integer } from "neo4j-driver";

export default class Modal extends React.Component<{ title: string; color?: string; handleClose: () => void; children: React.ReactNode }> {
    render() {
        return (
            <div className="modal is-active">
                <div className="modal-background"></div>
                <div className="modal-content">
                    <div className={"message " + (this.props.color || "")}>
                        <div className="message-header">
                            <p>{this.props.title}</p>
                            <button className="delete" aria-label="delete" onClick={this.props.handleClose}></button>
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
            <Modal title="Are you sure?" color="is-danger" handleClose={this.props.handleClose}>
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
