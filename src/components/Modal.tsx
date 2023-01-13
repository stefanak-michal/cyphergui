import * as React from "react";
import { Node as _Node } from "neo4j-driver";
import { Button, Checkbox } from "./form";
import { ClipboardContext } from "../utils/contexts";
import { toJSON } from "../utils/fn";
import { IStashManager } from "../utils/interfaces";
import db from "../db";

export default class Modal extends React.Component<{ title: string; color?: string; handleClose: () => void; children: React.ReactNode; icon?: string; backdrop?: boolean }> {
    render() {
        return (
            <div className="modal is-active">
                <div className="modal-background" onClick={this.props.backdrop && this.props.handleClose}></div>
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

export class SelectNodeModal extends React.Component<{ stashManager: IStashManager; handleNodeSelect: (node: _Node) => void; handleClose: () => void; database: string }, {}> {
    state = {
        id: "",
        error: null,
    };

    handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const isNum = /^\d+$/.test(this.state.id);

        db.driver
            .session({ database: this.props.database, defaultAccessMode: db.neo4j.session.READ })
            .run("MATCH (n) WHERE " + (isNum ? "id(n)" : "elementId") + " = $id RETURN n", {
                id: isNum ? db.neo4j.int(this.state.id) : this.state.id,
            })
            .then(response => {
                if (response.records.length > 0) {
                    this.props.handleNodeSelect(response.records[0].get("n"));
                    return true;
                } else {
                    this.setState({
                        error: "Node not found",
                    });
                    return false;
                }
            })
            .catch(err => {
                this.setState({
                    error: "[" + err.name + "] " + err.message,
                });
            });
    };

    render() {
        return (
            <Modal title="Select node" handleClose={this.props.handleClose} backdrop={true}>
                <label className="label">Stashed nodes</label>
                {this.props.stashManager.get().filter(s => s.value instanceof _Node).length > 0 ? (
                    <div className="buttons">
                        {this.props.stashManager
                            .get()
                            .filter(s => s.database === this.props.database && s.value instanceof _Node)
                            .map(s => (
                                <Button text={"#" + db.strId(s.value.identity)} color="" key={s.id} onClick={() => this.props.handleNodeSelect(s.value as _Node)} />
                            ))}
                    </div>
                ) : (
                    <div className="has-text-grey-light mb-3">none</div>
                )}
                <form onSubmit={this.handleSubmit}>
                    <label className="label">Or enter id {db.hasElementId ? "or elementId" : ""}</label>
                    <div className="field is-grouped">
                        <div className="control is-expanded">
                            <input
                                autoFocus
                                required
                                className="input"
                                type="text"
                                value={this.state.id}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const target = e.currentTarget;
                                    this.setState({ id: target.value, error: null });
                                }}
                            />
                        </div>
                        <div className="control">
                            <Button icon="fa-solid fa-check" type="submit" />
                        </div>
                    </div>
                    {this.state.error && <div className="notification is-danger">{this.state.error}</div>}
                </form>
            </Modal>
        );
    }
}
