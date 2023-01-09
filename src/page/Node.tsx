import * as React from "react";
import { Button, Property } from "../form";
import Modal, { DeleteModal } from "./block/Modal";
import { Integer, Node as Neo4jNode, Relationship as Neo4jRelationship } from "neo4j-driver";
import { EPage, EPropertyType } from "../enums";
import { IPageProps } from "../interfaces";
import db from "../db";

interface INodeProps extends IPageProps {
    database: string;
    label: string;
    id: Integer | string;
}

interface INodeState {
    node: Neo4jNode | null;
    focus: string | null;
    labels: string[];
    properties: { name: string; key: string; value: any; type: EPropertyType }[];
    labelModal: boolean | string[];
    labelModalInput: string;
    error: string | null;
    delete: Integer | string | false;
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
    };

    rels: Neo4jRelationship[] = [];
    nodes: Neo4jNode[] = [];

    requestData = () => {
        if (!this.props.id) return;
        db.getDriver()
            .session({
                database: this.props.database,
                defaultAccessMode: db.neo4j.session.READ,
            })
            .run("MATCH (n) WHERE " + db.fnId() + " = $id OPTIONAL MATCH (n)-[r]-(a) RETURN n, collect(DISTINCT r) AS r, collect(DISTINCT a) AS a", {
                id: this.props.id,
            })
            .then(response => {
                if (response.records.length === 0) {
                    this.props.tabManager.close(this.props.tabId);
                    return;
                }

                const node: Neo4jNode = response.records[0].get("n");
                let props = [];
                const t = new Date().getTime();
                for (let key in node.properties) {
                    //resolve property type
                    let type = EPropertyType.String;
                    if (typeof node.properties[key] === "number") type = EPropertyType.Float;
                    else if (db.isInteger(node.properties[key])) type = EPropertyType.Integer;
                    else if (typeof node.properties[key] === "boolean") type = EPropertyType.Boolean;
                    props.push({ name: key + t, key: key, value: node.properties[key], type: type });
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
            .catch(console.error);
    };

    componentDidMount() {
        this.requestData();
    }

    /**
     * Check if node still exists when switching on this tab
     */
    shouldComponentUpdate(nextProps: Readonly<INodeProps>) {
        if (this.props.id && nextProps.active && this.props.active !== nextProps.active) {
            db.getDriver()
                .session({
                    database: this.props.database,
                    defaultAccessMode: db.neo4j.session.READ,
                })
                .run("MATCH (n) WHERE " + db.fnId() + " = $id RETURN COUNT(n) AS c", {
                    id: this.props.id,
                })
                .then(response => {
                    if (db.neo4j.integer.toNumber(response.records[0].get("c")) !== 1) {
                        this.props.tabManager.close(this.props.tabId);
                    }
                })
                .catch(console.error);
        }
        return true;
    }

    handlePropertyKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let props = [...this.state.properties];
        props.filter(p => "key." + p.name === e.currentTarget.name)[0].key = e.currentTarget.value;
        this.setState({
            properties: props,
            focus: e.currentTarget.name,
        });
    };

    handlePropertyValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let props = [...this.state.properties];
        let value: any = e.currentTarget.value;
        switch (props.filter(p => p.name === e.currentTarget.name)[0].type) {
            case EPropertyType.Boolean:
                value = e.currentTarget.checked;
                break;
            case EPropertyType.Integer:
                value = db.neo4j.int(e.currentTarget.valueAsNumber);
                break;
            case EPropertyType.Float:
                value = e.currentTarget.valueAsNumber;
                break;
        }
        props.filter(p => p.name === e.currentTarget.name)[0].value = value;
        this.setState({
            properties: props,
            focus: e.currentTarget.name,
        });
    };

    handlePropertyTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        let props = [...this.state.properties];
        const i = props.findIndex(p => "type." + p.name === e.currentTarget.name);
        props[i].type = EPropertyType[e.currentTarget.value];
        switch (props[i].type) {
            case EPropertyType.Boolean:
                props[i].value = !!props[i].value;
                break;
            case EPropertyType.Integer:
                props[i].value = props[i].value.length ? db.neo4j.int(props[i].value) : 0;
                break;
            case EPropertyType.Float:
                props[i].value = props[i].value.length ? parseFloat(props[i].value) : 0;
                break;
            case EPropertyType.String:
                props[i].value = props[i].value.toString();
                break;
        }
        this.setState({
            properties: props,
            focus: e.currentTarget.name,
        });
    };

    handlePropertyDelete = (name: string) => {
        this.state.properties.splice(
            this.state.properties.findIndex(p => p.name === name),
            1
        );
        this.setState({
            properties: this.state.properties,
        });
    };

    handlePropertyAdd = () => {
        const i = new Date().getTime().toString();
        this.state.properties.push({ name: i, key: "", value: "", type: EPropertyType.String });
        this.setState({
            properties: this.state.properties,
            focus: "key." + i,
        });
    };

    handleLabelOpenModal = () => {
        db.getDriver()
            .session({
                database: this.props.database,
                defaultAccessMode: db.neo4j.session.READ,
            })
            .run("MATCH (n) WITH DISTINCT labels(n) AS ll UNWIND ll AS l RETURN collect(DISTINCT l) AS c")
            .then(response => {
                this.setState({
                    labelModal: response.records[0].get("c").filter(l => this.state.labels.indexOf(l) === -1),
                });
            })
            .catch(console.error);
    };

    handleLabelSelect = (label: string) => {
        if (this.state.labels.indexOf(label) === -1) this.state.labels.push(label);
        this.setState({
            labels: this.state.labels,
            labelModal: false,
            labelModalInput: "",
        });
    };

    handleLabelDelete = (label: string) => {
        const i = this.state.labels.indexOf(label);
        if (i === -1) return;
        this.state.labels.splice(i, 1);
        this.setState({
            labels: this.state.labels,
        });
    };

    handleLabelModalClose = () => {
        this.setState({
            labelModal: false,
        });
    };

    handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const { query, props } = this.generateQuery();

        //todo log query somewhere? create log terminal?
        db.getDriver()
            .session({
                database: this.props.database,
                defaultAccessMode: db.neo4j.session.WRITE,
            })
            .run(query, {
                id: this.props.id,
                p: props,
            })
            .then(response => {
                if (response.summary.counters.containsUpdates()) {
                    this.props.toast(this.props.id ? "Node updated" : "Node created");
                }
                if (this.props.settings.closeEditAfterExecuteSuccess) {
                    this.props.tabManager.close(this.props.tabId);
                } else if (!this.props.id) {
                    const node = response.records[0].get("n");
                    this.props.tabManager.add(this.props.tabManager.generateName("Node", node.identity), "fa-solid fa-pen-to-square", EPage.Node, {
                        id: db.hasElementId ? node.elementId : node.identity,
                        database: this.props.database,
                    });
                    this.props.tabManager.close(this.props.tabId);
                }
            })
            .catch(console.error);
    };

    generateQuery = (printable: boolean = false): { query: string; props: object } => {
        let setLabels = this.props.id ? this.state.labels.filter(l => this.state.node.labels.indexOf(l) === -1).join(":") : this.state.labels.join(":");
        if (setLabels.length > 0) setLabels = " SET n:" + setLabels;
        let removeLabels = this.props.id ? this.state.node.labels.filter(l => this.state.labels.indexOf(l) === -1).join(":") : "";
        if (removeLabels.length > 0) removeLabels = " REMOVE n:" + removeLabels;

        let props = {};
        for (let p of this.state.properties) props[p.key] = p.value;

        let query: string = "";
        if (printable) {
            if (this.props.id) query += "MATCH (n) WHERE " + db.fnId() + " = " + (db.hasElementId ? "'" + this.props.id + "'" : db.neo4j.integer.toString(this.props.id));
            else query += "CREATE (n)";
            query += setLabels + removeLabels;
            if (this.state.properties.length) {
                query += " SET n = {";
                let s = [];
                for (let p of this.state.properties) {
                    switch (p.type) {
                        case EPropertyType.String:
                            s.push(p.key + ": '" + p.value.replaceAll("'", "\\'").replaceAll("\n", "\\n") + "'");
                            break;
                        case EPropertyType.Integer:
                            s.push(p.key + ": " + db.neo4j.integer.toString(p.value));
                            break;
                        default:
                            s.push(p.key + ": " + p.value.toString());
                    }
                }
                query += s.join(", ") + "}";
            }
        } else {
            query += (this.props.id ? "MATCH (n) WHERE " + db.fnId() + " = $id" : "CREATE (n)") + setLabels + removeLabels + " SET n = $p RETURN n";
        }

        return { query: query, props: props };
    };

    handleDeleteModalConfirm = (id: Integer | string, detach: boolean) => {
        db.getDriver()
            .session({
                database: this.props.database,
                defaultAccessMode: db.neo4j.session.WRITE,
            })
            .run("MATCH (n) WHERE " + db.fnId() + " = $id " + (detach ? "DETACH " : "") + "DELETE n", {
                id: id,
            })
            .then(response => {
                if (response.summary.counters.updates().nodesDeleted > 0) {
                    this.props.tabManager.close(this.props.tabId);
                    this.props.toast("Node deleted");
                }
            })
            .catch(error => {
                this.setState({
                    error: error.message,
                });
            });
    };

    render() {
        if (!this.props.active) return;
        document.title = this.props.tabName + " (db: " + this.props.database + ")";

        if (this.props.id && this.state.node === null) {
            return <span className="has-text-grey-light">Loading...</span>;
        }

        return (
            <>
                {this.state.delete && <DeleteModal delete={this.state.delete} detach handleConfirm={this.handleDeleteModalConfirm} handleClose={() => this.setState({ delete: false })} />}

                {Array.isArray(this.state.labelModal) && (
                    <Modal title="Add label" handleClose={this.handleLabelModalClose}>
                        <div className="buttons">
                            {this.state.labelModal.map(label => (
                                <Button text={label} color="is-link is-rounded" key={label} onClick={() => this.handleLabelSelect(label)} />
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
                                    <input
                                        autoFocus
                                        pattern="^[A-Za-z][A-Za-z_0-9]*$"
                                        required
                                        className="input"
                                        type="text"
                                        value={this.state.labelModalInput}
                                        onChange={e => this.setState({ labelModalInput: e.currentTarget.value })}
                                    />
                                </div>
                                <div className="control">
                                    <Button icon="fa-solid fa-check" type="submit" />
                                </div>
                            </div>
                        </form>
                    </Modal>
                )}

                <form onSubmit={this.handleSubmit}>
                    {this.props.id && (
                        <div className="columns">
                            <div className="column is-half-desktop">
                                <div className="field">
                                    <label className="label">identity</label>
                                    <div className="control">
                                        <input className="input" disabled type="text" value={db.neo4j.integer.toString(this.state.node.identity)} />
                                    </div>
                                </div>
                            </div>
                            <div className="column is-half-desktop">
                                {this.props.settings.showElementId && db.hasElementId && (
                                    <div className="field">
                                        <label className="label">elementId</label>
                                        <div className="control">
                                            <input className="input" disabled type="text" value={this.state.node.elementId} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <fieldset className="box">
                        <legend className="tag is-link is-light">
                            <i className="fa-solid fa-tags mr-2"></i>Labels
                        </legend>
                        <div className="buttons tags">
                            {this.state.labels.map(label => (
                                <span key={"label-" + label} className="tag is-link is-medium mr-3 is-rounded">
                                    <a
                                        className="has-text-white mr-1"
                                        onClick={() => this.props.tabManager.add(label, "fa-regular fa-circle", EPage.Label, { label: label, database: this.props.database })}>
                                        {label}
                                    </a>
                                    <button className="delete" onClick={() => this.handleLabelDelete(label)}></button>
                                </span>
                            ))}
                            <Button icon="fa-solid fa-plus" color="button tag is-medium" onClick={this.handleLabelOpenModal} />
                        </div>
                    </fieldset>

                    <fieldset className="box">
                        <legend className="tag is-link is-light">
                            <i className="fa-regular fa-rectangle-list mr-2"></i>Properties
                        </legend>
                        {this.state.properties.map(p => (
                            <Property
                                key={p.name}
                                name={p.name}
                                mapKey={p.key}
                                focus={this.state.focus}
                                value={p.value}
                                type={p.type}
                                onKeyChange={this.handlePropertyKeyChange}
                                onValueChange={this.handlePropertyValueChange}
                                onTypeChange={this.handlePropertyTypeChange}
                                onDelete={this.handlePropertyDelete}
                            />
                        ))}

                        <Button icon="fa-solid fa-plus" text="Add property" onClick={this.handlePropertyAdd} />
                    </fieldset>

                    {this.rels.length > 0 && (
                        <fieldset className="box">
                            <legend className="tag is-link is-light">
                                <i className="fa-solid fa-circle-nodes mr-2"></i>Relationships
                            </legend>
                            {this.rels.map(r => {
                                const dir = (db.hasElementId ? r.startNodeElementId : r.start) === this.props.id ? 1 : 2;
                                const node = this.nodes.find(
                                    n => (db.hasElementId ? n.elementId : n.identity) === (db.hasElementId ? (dir === 2 ? r.startNodeElementId : r.endNodeElementId) : dir === 2 ? r.start : r.end)
                                );

                                return (
                                    <div className="is-flex is-align-items-center is-justify-content-flex-start mb-3 mb-last-none">
                                        <span className="is-family-code">
                                            {dir === 1 && "<"}
                                            -[
                                        </span>
                                        <Button
                                            color="tag is-info is-rounded px-3"
                                            onClick={() => this.props.tabManager.add(r.type, "fa-solid fa-arrow-right-long", EPage.Type, { type: r.type, database: db.getActiveDb() })}
                                            key={r.type}
                                            text={r.type}
                                        />
                                        <Button
                                            onClick={() =>
                                                this.props.tabManager.add(this.props.tabManager.generateName("Rel", r.identity), "fa-solid fa-pen-to-square", EPage.Rel, {
                                                    id: db.hasElementId ? r.elementId : r.identity,
                                                    database: this.props.database,
                                                })
                                            }
                                            color="is-small ml-1"
                                            icon="fa-solid fa-pen-clip"
                                            text={"#" + db.neo4j.integer.toString(r.identity)}
                                        />
                                        ]-
                                        <span className="is-family-code">{dir === 2 && ">"}(</span>
                                        {node.labels.map(label => (
                                            <Button
                                                color="tag is-link is-rounded px-3"
                                                onClick={() => this.props.tabManager.add(label, "fa-regular fa-circle", EPage.Label, { label: label, database: db.getActiveDb() })}
                                                key={label}
                                                text={label}
                                            />
                                        ))}
                                        <Button
                                            onClick={() =>
                                                this.props.tabManager.add(this.props.tabManager.generateName("Node", node.identity), "fa-solid fa-pen-to-square", EPage.Node, {
                                                    id: db.hasElementId ? node.elementId : node.identity,
                                                    database: this.props.database,
                                                })
                                            }
                                            color="is-small ml-1"
                                            icon="fa-solid fa-pen-clip"
                                            text={"#" + db.neo4j.integer.toString(node.identity)}
                                        />
                                        <span className="is-family-code">)</span>
                                        <span className="ml-auto">end line buttons - stash (path)?</span>
                                    </div>
                                );
                            })}
                        </fieldset>
                    )}

                    <div className="mb-3">
                        <span className="icon-text is-flex-wrap-nowrap">
                            <span className="icon">
                                <i className="fa-solid fa-terminal" aria-hidden="true"></i>
                            </span>
                            <span className="is-family-code is-pre-wrap">{this.generateQuery(true).query}</span>
                        </span>
                    </div>

                    <div className="field">
                        <div className="control buttons is-justify-content-flex-end">
                            <Button color="is-success" type="submit" icon="fa-solid fa-check" text="Execute" />
                            {this.props.id && this.props.stashManager.button(this.state.node, this.props.database)}
                            {this.props.id && <Button icon="fa-solid fa-refresh" text="Reload" onClick={this.requestData} />}
                            <Button icon="fa-solid fa-xmark" text="Close" onClick={e => this.props.tabManager.close(this.props.tabId, e)} />
                            {this.props.id && (
                                <Button
                                    icon="fa-regular fa-trash-can"
                                    color="is-danger"
                                    text="Delete"
                                    onClick={() => this.setState({ delete: db.hasElementId ? this.state.node.elementId : this.state.node.identity })}
                                />
                            )}
                        </div>
                    </div>
                </form>
            </>
        );
    }
}

export default Node;
