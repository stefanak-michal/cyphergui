import * as React from "react";
import { Button, Checkbox } from "./form";
import { ClipboardContext } from "../utils/contexts";
import { toJSON } from "../utils/fn";

export default class Modal extends React.Component<{
    title: string;
    color?: string;
    handleClose: () => void;
    children?: React.ReactNode;
    icon?: string;
    backdrop?: boolean;
    buttons?: React.ReactNode;
}> {
    render() {
        return (
            <div className="modal is-active">
                <div className="modal-background" onClick={this.props.backdrop && this.props.handleClose}></div>
                <div className="modal-card">
                    <header className={"modal-card-head " + (this.props.color || "is-dark")}>
                        <p className="modal-card-title">
                            {this.props.icon && (
                                <span className="icon mr-3">
                                    <i className={this.props.icon} />
                                </span>
                            )}
                            {this.props.title}
                        </p>
                        <button className="delete" aria-label="close" onClick={this.props.handleClose} />
                    </header>
                    {this.props.children && <section className="modal-card-body">{this.props.children}</section>}
                    {this.props.buttons && <footer className="modal-card-foot is-justify-content-flex-end">{this.props.buttons}</footer>}
                </div>
            </div>
        );
    }
}

export class DeleteModal extends React.Component<
    { delete: number | string; detach?: boolean; handleConfirm: (id: number | string, detach: boolean) => void; handleClose: () => void },
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
            <Modal
                title="Are you sure?"
                color="is-danger"
                handleClose={this.props.handleClose}
                icon="fa-solid fa-triangle-exclamation"
                buttons={
                    <>
                        <Button text="Confirm" icon="fa-solid fa-check" onClick={this.handleConfirm} color="is-danger" />
                        <Button text="Cancel" icon="fa-solid fa-xmark" onClick={this.props.handleClose} color="is-secondary" />
                    </>
                }>
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
            </Modal>
        );
    }
}

export class PropertiesModal extends React.Component<{ properties: object; handleClose: () => void }, {}> {
    render() {
        return (
            <Modal title="Properties" handleClose={this.props.handleClose} icon="fa-solid fa-rectangle-list" backdrop={true}>
                <div className="control has-icons-right">
                    <pre>{toJSON(this.props.properties)}</pre>
                    <ClipboardContext.Consumer>
                        {copy => (
                            <span className="icon is-right is-clickable" onClick={copy}>
                                <i className="fa-regular fa-copy" />
                            </span>
                        )}
                    </ClipboardContext.Consumer>
                </div>
            </Modal>
        );
    }
}
