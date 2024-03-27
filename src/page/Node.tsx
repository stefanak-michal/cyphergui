import * as React from "react";
import { Button } from "../components/form";
import { Node as _Node, Relationship as _Relationship } from "neo4j-driver";
import { EPage, EPropertyType } from "../utils/enums";
import { IPageProps } from "../utils/interfaces";
import db from "../db";
import { ClipboardContext } from "../utils/contexts";
import Modal, { DeleteModal } from "../components/Modal";
import { settings } from "../layout/Settings";
import InlineRelationship from "../components/InlineRelationship";
import InlineNode from "../components/InlineNode";
import { t_FormProperty, t_FormValue } from "../utils/types";
import PropertiesForm from "../components/PropertiesForm";
import { getPropertyAsTemp, printProperties, resolvePropertyType, sanitizeFormValues } from "../utils/fn";

interface INodeProps extends IPageProps {
    database: string;
    label: string;
    id: number | string | null;
}

interface INodeState {
    node: _Node | null;
    focus: string | null;
    labels: string[];
    properties: t_FormProperty[];
    labelModal: boolean | string[];
    labelModalInput: string;
    error: string | null;
    delete: number | string | false;
    showAllRels: boolean;
}

/**
 * Edit node by ID
 */
class Node extends React.Component<INodeProps, INodeState> {
    state: INodeState = {
        node: null,
        focus: null,
        labels: !!this.props.label ? [this.props.label] : [],
        properties: [],
        labelModal: false,
        labelModalInput: "",
        error: null,
        delete: false,
        showAllRels: false,
    };

    rels: _Relationship[] = [];
    nodes: _Node[] = [];
    create: boolean = this.props.id === null;

    requestData = () => {
        if (this.create) return;
        db.query(
            "MATCH (n) WHERE " + db.fnId() + " = $id OPTIONAL MATCH (n)-[r]-(a) RETURN n, collect(DISTINCT r) AS r, collect(DISTINCT a) AS a",
            {
                id: this.props.id,
            },
            this.props.database
        )
            .then(response => {
                if (response.records.length === 0) {
                    this.props.tabManager.close(this.props.tabId);
                    return;
                }

                const node: _Node = response.records[0].get("n");
                let props: t_FormProperty[] = [];
                const t = new Date().getTime();
                for (let key in node.properties) {
                    const type = resolvePropertyType(node.properties[key]);
                    if (type === EPropertyType.List) {
                        const subtype = resolvePropertyType(node.properties[key][0]);
                        node.properties[key] = (node.properties[key] as []).map(p => {
                            return { value: p, type: subtype, temp: getPropertyAsTemp(subtype, p) } as t_FormValue;
                        });
                    }
                    if (type === EPropertyType.Map) {
                        const mapAsFormValue: t_FormValue[] = [];
                        for (let k in (node.properties[key] as object)) {
                            const subtype = resolvePropertyType(node.properties[key][k]);
                            mapAsFormValue.push({
                                key: k,
                                value: node.properties[key][k],
                                type: subtype,
                                temp: getPropertyAsTemp(subtype, node.properties[key][k])
                            } as t_FormValue);
                        }
                        node.properties[key] = mapAsFormValue;
                    }
                    props.push({ name: key + t, key: key, value: node.properties[key], type: type, temp: getPropertyAsTemp(type, node.properties[key]) });
                }
                props.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

                this.rels = response.records[0].get("r");
                this.nodes = response.records[0].get("a");

                this.setState({
                    node: node,
                    labels: [...node.labels],
                    properties: props,
                });
            })
            .catch(() => this.props.tabManager.close(this.props.tabId));
    };

    componentDidMount() {
        this.requestData();
    }

    /**
     * Check if node still exists when switching on this tab
     */
    componentDidUpdate(prevProps: Readonly<INodeProps>) {
        if (!this.create && this.props.active && this.props.active !== prevProps.active) {
            db.query(
                "MATCH (n) WHERE " + db.fnId() + " = $id RETURN COUNT(n) AS c",
                {
                    id: this.props.id,
                },
                this.props.database
            )
                .then(response => {
                    if (db.fromInt(response.records[0].get("c")) !== 1) {
                        this.props.tabManager.close(this.props.tabId);
                    }
                })
                .catch(() => this.props.tabManager.close(this.props.tabId));
        }
    }

    handleLabelOpenModal = () => {
        db.query("MATCH (n) WITH DISTINCT labels(n) AS ll UNWIND ll AS l RETURN collect(DISTINCT l) AS c", {}, this.props.database)
            .then(response => {
                this.setState({
                    labelModal: response.records[0].get("c").filter(l => !this.state.labels.includes(l)),
                });
            })
            .catch(err => this.setState({ error: "[" + err.name + "] " + err.message }));
    };

    handleLabelSelect = (label: string) => {
        this.setState(state => {
            return {
                labels: !state.labels.includes(label) ? state.labels.concat(label) : state.labels,
                labelModal: false,
                labelModalInput: "",
            };
        }, this.markChanged);
    };

    handleLabelInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value: string = e.currentTarget.value;

        if (settings().forceNamingRecommendations) {
            value = value
                .replace(/^[^a-zA-Z]*/, "")
                .replace(/^[a-z]/, x => x.toUpperCase())
                .replace(/_[a-zA-Z]/, x => x.substring(1).toUpperCase());
        }

        this.setState({ labelModalInput: value });
    };

    handleLabelDelete = (label: string) => {
        this.setState(state => {
            let labels = [...state.labels];
            const i = this.state.labels.indexOf(label);
            if (i !== -1) labels.splice(i, 1);
            return {
                labels: labels,
            };
        }, this.markChanged);
    };

    handleLabelModalClose = () => {
        this.setState({
            labelModal: false,
        });
    };

    handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const { query, props } = this.generateQuery();

        db.query(
            query,
            {
                id: this.props.id,
                p: props,
            },
            this.props.database
        )
            .then(response => {
                if (response.summary.counters.containsUpdates()) {
                    this.props.toast(this.create ? "Node created" : "Node updated");
                }
                if (settings().closeEditAfterExecuteSuccess) {
                    this.props.tabManager.close(this.props.tabId);
                } else if (this.create) {
                    const node = response.records[0].get("n");
                    this.props.tabManager.setChanged(this.props.tabId, false, () => {
                        this.props.tabManager.add({ prefix: "Node", i: node.identity }, "fa-solid fa-pen-to-square", EPage.Node, {
                            id: db.getId(node),
                            database: this.props.database,
                        });
                        this.props.tabManager.close(this.props.tabId);
                    });
                }
            })
            .catch(err => this.setState({ error: "[" + err.name + "] " + err.message }));
    };

    generateQuery = (printable: boolean = false): { query: string; props: object } => {
        let setLabels = !this.create ? this.state.labels.filter(l => !this.state.node.labels.includes(l)).join(":") : this.state.labels.join(":");
        if (setLabels.length > 0) setLabels = " SET n:" + setLabels;
        let removeLabels = !this.create ? this.state.node.labels.filter(l => !this.state.labels.includes(l)).join(":") : "";
        if (removeLabels.length > 0) removeLabels = " REMOVE n:" + removeLabels;

        const props = sanitizeFormValues(this.state.properties);
        let query: string = "";
        if (printable) {
            if (!this.create) query += "MATCH (n) WHERE " + db.fnId() + " = " + (typeof this.props.id === "string" ? "'" + this.props.id + "'" : this.props.id);
            else query += "CREATE (n)";
            query += setLabels + removeLabels;
            if (this.state.properties.length) {
                query += " SET n = " + printProperties(this.state.properties);
            }
        } else {
            query += (!this.create ? "MATCH (n) WHERE " + db.fnId() + " = $id" : "CREATE (n)") + setLabels + removeLabels + " SET n = $p RETURN n";
        }

        return { query: query, props: props };
    };

    handleDeleteModalConfirm = (id: number | string, detach: boolean) => {
        db.query(
            "MATCH (n) WHERE " + db.fnId() + " = $id " + (detach ? "DETACH " : "") + "DELETE n",
            {
                id: id,
            },
            this.props.database
        )
            .then(response => {
                if (response.summary.counters.updates().nodesDeleted > 0) {
                    this.props.tabManager.setChanged(this.props.tabId, false, () => this.props.tabManager.close(this.props.tabId));
                    this.props.toast("Node deleted");
                }
            })
            .catch(error => {
                this.setState({
                    error: error.message,
                });
            });
    };

    markChanged = () => {
        this.props.tabManager.setChanged(this.props.tabId,
            this.create || (
                this.state.node.labels.sort().toString() !== this.state.labels.sort().toString()
                || Object.keys(this.state.node.properties).sort().toString() !== this.state.properties.map(p => p.key).sort().toString()
                || this.state.properties.some(p => p.value.toString() !== this.state.node.properties[p.key].toString())
            )
        );
    };

    render() {
        if (!this.create && this.state.node === null) {
            return <span className="has-text-grey-light">Loading...</span>;
        }

        return (
            <>
                {this.state.delete && <DeleteModal delete={this.state.delete} detach handleConfirm={this.handleDeleteModalConfirm} handleClose={() => this.setState({ delete: false })} />}

                {Array.isArray(this.state.labelModal) && (
                    <Modal title="Add label" icon="fa-solid fa-tag" handleClose={this.handleLabelModalClose}>
                        <div className="buttons">
                            {this.state.labelModal.map(label => (
                                <Button text={label} color="is-link is-rounded tag is-medium" key={label} onClick={() => this.handleLabelSelect(label)} />
                            ))}
                        </div>
                        <form
                            onSubmit={e => {
                                e.preventDefault();
                                this.handleLabelSelect(this.state.labelModalInput);
                                return true;
                            }}>
                            <label className="label">Or specify new one</label>
                            <div className="field is-grouped">
                                <div className="control is-expanded">
                                    <input autoFocus pattern="^[A-Za-z][A-Za-z_0-9]*$" required className="input" type="text" value={this.state.labelModalInput} onChange={this.handleLabelInput} />
                                </div>
                                <div className="control">
                                    <Button icon="fa-solid fa-check" type="submit" />
                                </div>
                            </div>
                        </form>
                    </Modal>
                )}

                <form onSubmit={this.handleSubmit}>
                    {!this.create && (
                        <ClipboardContext.Consumer>
                            {copy => (
                                <div className="columns">
                                    <div className={"column " + (db.hasElementId ? "is-half-desktop" : "")}>
                                        <div className="field">
                                            <label className="label">identity</label>
                                            <div className="control" onClick={copy}>
                                                <input className="input is-copyable" readOnly type="text" value={db.strInt(this.state.node.identity)} />
                                            </div>
                                        </div>
                                    </div>
                                    {db.hasElementId && (
                                        <div className="column is-half-desktop">
                                            <div className="field">
                                                <label className="label">elementId</label>
                                                <div className="control" onClick={copy}>
                                                    <input className="input is-copyable" readOnly type="text" value={this.state.node.elementId} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </ClipboardContext.Consumer>
                    )}

                    <fieldset className="box">
                        <legend className="tag is-link is-light">
                            <i className="fa-solid fa-tags mr-2" />
                            Labels
                        </legend>
                        <div className="buttons tags">
                            {this.state.labels.map(label => (
                                <span key={"label-" + label} className="tag is-link is-medium is-rounded">
                                    <a
                                        className="has-text-white mr-1"
                                        onClick={() => this.props.tabManager.add(label, "fa-regular fa-circle", EPage.Label, { label: label, database: this.props.database })}>
                                        {label}
                                    </a>
                                    <button className="delete" onClick={() => this.handleLabelDelete(label)} />
                                </span>
                            ))}
                            <Button icon="fa-solid fa-plus" onClick={this.handleLabelOpenModal} />
                        </div>
                    </fieldset>

                    <fieldset className="box">
                        <legend className="tag is-link is-light">
                            <i className="fa-solid fa-rectangle-list mr-2" />
                            Properties
                        </legend>
                        <PropertiesForm
                            properties={this.state.properties}
                            updateProperties={properties => {
                                this.setState({ properties: properties }, this.markChanged);
                            }}
                        />
                    </fieldset>

                    {this.rels.length > 0 && (
                        <fieldset className="box">
                            <legend className="tag is-link is-light">
                                <i className="fa-solid fa-circle-nodes mr-2" />
                                Relationships
                            </legend>
                            {(this.state.showAllRels ? this.rels : this.rels.slice(0, 3)).map(r => {
                                const dir = db.getId(r, "startNodeElementId", "start") === this.props.id ? 1 : 2;
                                const node = this.nodes.find(n => db.getId(n) === db.getId(r, dir === 2 ? "startNodeElementId" : "endNodeElementId", dir === 2 ? "start" : "end"));

                                return (
                                    <div key={db.strInt(r.identity)} className="is-flex is-align-items-center is-justify-content-flex-start mb-3 mb-last-none">
                                        <i className="fa-regular fa-circle" />
                                        <span className="is-size-4">
                                            {dir === 2 && "<"}
                                            -[
                                        </span>
                                        <InlineRelationship rel={r} tabManager={this.props.tabManager} small={true} />
                                        <span className="is-size-4">]-{dir === 1 && ">"}(</span>
                                        <InlineNode node={node} tabManager={this.props.tabManager} small={true} />
                                        <span className=" is-size-4">)</span>
                                        <span className="ml-auto"></span>
                                    </div>
                                );
                            })}
                            {!this.state.showAllRels && this.rels.length > 3 && (
                                <Button icon="fa-solid fa-caret-down" text={"Show all (+" + (this.rels.length - 3) + ")"} onClick={() => this.setState({ showAllRels: true })} />
                            )}
                        </fieldset>
                    )}

                    <div className="mb-3" style={{ overflowY: "auto" }}>
                        <span className="icon-text is-flex-wrap-nowrap">
                            <span className="icon">
                                <i className="fa-solid fa-terminal" aria-hidden="true" />
                            </span>
                            <ClipboardContext.Consumer>
                                {copy => (
                                    <span className="is-family-code is-pre-wrap is-copyable" onClick={copy}>
                                        {this.generateQuery(true).query}
                                    </span>
                                )}
                            </ClipboardContext.Consumer>
                        </span>
                    </div>

                    {this.state.error && (
                        <div className="message is-danger">
                            <div className="message-header">
                                <p>Error</p>
                                <button className="delete" aria-label="delete" onClick={() => this.setState({ error: null })} />
                            </div>
                            <div className="message-body">{this.state.error}</div>
                        </div>
                    )}

                    <div className="field">
                        <div className="control buttons is-justify-content-flex-end">
                            <Button color="is-success" type="submit" icon="fa-solid fa-check" text="Execute" />
                            {!this.create && this.props.stashManager.button(this.state.node, this.props.database)}
                            {!this.create && <Button icon="fa-solid fa-refresh" text="Reload" onClick={this.requestData} />}
                            <Button icon="fa-solid fa-xmark" text="Close" onClick={e => this.props.tabManager.close(this.props.tabId, e)} />
                            {!this.create && <Button icon="fa-regular fa-trash-can" color="is-danger" text="Delete" onClick={() => this.setState({ delete: db.getId(this.state.node) })} />}
                        </div>
                    </div>
                </form>
            </>
        );
    }
}

export default Node;
