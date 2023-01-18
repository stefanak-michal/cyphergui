import * as React from "react";
import { IPageProps } from "../utils/interfaces";
import { Node as _Node, Relationship as _Relationship } from "neo4j-driver";
import { EPage, EPropertyType } from "../utils/enums";
import { Button } from "../components/form";
import db from "../db";
import { ClipboardContext } from "../utils/contexts";
import Modal, { DeleteModal, SelectNodeModal } from "../components/Modal";
import { settings } from "../layout/Settings";
import InlineNode from "../components/InlineNode";
import PropertiesForm from "../components/PropertiesForm";
import { t_FormProperty } from "../utils/types";
import { getPropertyAsTemp, printProperties, resolvePropertyType } from "../utils/fn";

interface IRelationshipProps extends IPageProps {
    database: string;
    type: string;
    id: number | string | null;
}

interface IRelationshipState {
    rel: _Relationship | null;
    start: _Node | null;
    end: _Node | null;
    focus: string | null;
    type: string;
    properties: t_FormProperty[];
    typeModal: false | string[];
    typeModalInput: string;
    error: string | null;
    delete: number | string | false;
    selectNodeModal: number | null; // null - hide, 1 - start node, 2 - end node
}

/**
 * Edit relationship by ID
 */
class Relationship extends React.Component<IRelationshipProps, IRelationshipState> {
    state: IRelationshipState = {
        rel: null,
        start: null,
        end: null,
        focus: null,
        type: this.props.type || "",
        properties: [],
        typeModal: false,
        typeModalInput: "",
        error: null,
        delete: false,
        selectNodeModal: null,
    };

    create: boolean = this.props.id === null;

    requestData = () => {
        if (this.create) return;
        db.driver
            .session({
                database: this.props.database,
                defaultAccessMode: db.neo4j.session.READ,
            })
            .run("MATCH (a)-[r]->(b) WHERE " + db.fnId("r") + " = $id RETURN r, a, b", {
                id: this.props.id,
            })
            .then(response => {
                if (response.records.length === 0) {
                    this.props.tabManager.close(this.props.tabId);
                    return;
                }

                const rel: _Relationship = response.records[0].get("r");
                let props: t_FormProperty[] = [];
                const t = new Date().getTime();
                for (let key in rel.properties) {
                    const type = resolvePropertyType(rel.properties[key]);
                    const subtype = type === EPropertyType.List ? resolvePropertyType(rel.properties[key][0]) : null;
                    props.push({ name: key + t, key: key, value: rel.properties[key], type: type, subtype: subtype, temp: getPropertyAsTemp(type, rel.properties[key], subtype) });
                }
                props.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
                this.setState({
                    rel: rel,
                    start: response.records[0].get("a") as _Node,
                    end: response.records[0].get("b") as _Node,
                    type: rel.type,
                    properties: props,
                });
            })
            .catch(err => {
                console.error(err);
                this.props.tabManager.close(this.props.tabId);
            });
    };

    componentDidMount() {
        this.requestData();
    }

    /**
     * Check if node still exists when switching on this tab
     */
    componentDidUpdate(prevProps: Readonly<IRelationshipProps>) {
        if (!this.create && this.props.active && this.props.active !== prevProps.active) {
            db.driver
                .session({
                    database: this.props.database,
                    defaultAccessMode: db.neo4j.session.READ,
                })
                .run("MATCH ()-[r]->() WHERE " + db.fnId("r") + " = $id RETURN COUNT(r) AS c", {
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

    handleTypeOpenModal = () => {
        db.driver
            .session({
                database: this.props.database,
                defaultAccessMode: db.neo4j.session.READ,
            })
            .run("MATCH ()-[r]->() RETURN collect(DISTINCT type(r)) AS c")
            .then(response => {
                this.setState({
                    typeModal: response.records[0].get("c").filter(t => this.state.type !== t),
                });
            })
            .catch(console.error);
    };

    handleTypeSelect = (type: string) => {
        this.setState({
            type: type,
            typeModal: false,
            typeModalInput: "",
        });
    };

    handleTypeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value: string = e.currentTarget.value;

        if (settings().forceNamingRecommendations) {
            value = value.replace(/^[^a-zA-Z]*/, "").replace(/[a-z]/, x => x.toUpperCase());
        }

        this.setState({ typeModalInput: value });
    };

    handleTypeModalClose = () => {
        this.setState({
            typeModal: false,
        });
    };

    handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!this.state.type) {
            this.setState({ error: "Not defined relationship type" });
            return false;
        }
        if (!this.state.start) {
            this.setState({ error: "Not defined start node" });
            return false;
        }
        if (!this.state.end) {
            this.setState({ error: "Not defined end node" });
            return false;
        }

        const { query, props } = this.generateQuery();

        //todo log query somewhere? create log terminal?
        db.driver
            .session({
                database: this.props.database,
                defaultAccessMode: db.neo4j.session.WRITE,
            })
            .run(query, {
                id: this.state.rel ? (db.hasElementId ? this.state.rel.elementId : this.state.rel.identity) : null,
                a: db.hasElementId ? this.state.start.elementId : this.state.start.identity,
                b: db.hasElementId ? this.state.end.elementId : this.state.end.identity,
                p: props,
            })
            .then(response => {
                if (response.summary.counters.containsUpdates()) {
                    this.props.toast(this.create ? "Relationship created" : "Relationship updated");

                    if (!settings().closeEditAfterExecuteSuccess) {
                        const rel = response.records[0].get("r");
                        if (this.create || db.getId(this.state.rel) !== db.getId(rel)) {
                            this.props.tabManager.add({ prefix: "Rel", i: rel.identity }, "fa-solid fa-pen-to-square", EPage.Rel, {
                                id: db.getId(rel),
                                database: this.props.database,
                            });
                            this.props.tabManager.close(this.props.tabId);
                        }
                    }
                }

                if (settings().closeEditAfterExecuteSuccess) {
                    this.props.tabManager.close(this.props.tabId);
                }
            })
            .catch(console.error);
    };

    generateQuery = (printable: boolean = false): { query: string; props: object } => {
        let props = {};
        for (let p of this.state.properties) props[p.key] = p.value;

        let query: string = "";
        const quoteId = (id: number | string): string => {
            if (typeof id === "number") return id.toString();
            else return "'" + id + "'";
        };

        if (this.create) {
            query += "MATCH (a) WHERE " + db.fnId("a") + " = " + (this.state.start ? (printable ? quoteId(db.getId(this.state.start)) : "$a") : "");
            query += " MATCH (b) WHERE " + db.fnId("b") + " = " + (this.state.end ? (printable ? quoteId(db.getId(this.state.end)) : "$b") : "");
            query += " CREATE (a)-[r:" + this.state.type + "]->(b)";
        } else {
            const newStart = db.getId(this.state.rel, "startNodeElementId", "start") !== db.getId(this.state.start);
            const newEnd = db.getId(this.state.rel, "endNodeElementId", "end") !== db.getId(this.state.end);
            const willDelete = newStart || newEnd || this.state.rel.type !== this.state.type;

            query += "MATCH " + (newStart ? "()" : "(a)") + "-[r]->" + (newEnd ? "()" : "(b)");
            query += " WHERE " + db.fnId("r") + " = " + (printable ? quoteId(this.props.id) : "$id");
            if (newStart) query += " MATCH (a) WHERE " + db.fnId("a") + " = " + (printable ? quoteId(db.getId(this.state.start)) : "$a");
            if (newEnd) query += " MATCH (b) WHERE " + db.fnId("b") + " = " + (printable ? quoteId(db.getId(this.state.end)) : "$b");
            if (willDelete) query += " DELETE r";
            if (willDelete) query += " WITH a, b CREATE (a)-[r:" + this.state.type + "]->(b)";
        }

        if (printable) {
            if (this.state.properties.length) {
                query += " SET r = " + printProperties(this.state.properties);
            }
        } else {
            query += " SET r = $p RETURN r";
        }

        return { query: query, props: props };
    };

    handleDeleteModalConfirm = (id: number | string) => {
        db.driver
            .session({
                database: this.props.database,
                defaultAccessMode: db.neo4j.session.WRITE,
            })
            .run("MATCH ()-[r]-() WHERE " + db.fnId("r") + " = $id DELETE r", {
                id: id,
            })
            .then(response => {
                if (response.summary.counters.updates().nodesDeleted > 0) {
                    this.props.tabManager.close(id + this.props.database);
                    this.props.toast("Relationship deleted");
                }
            })
            .catch(error => {
                this.setState({
                    error: error.message,
                });
            });
    };

    render() {
        if (!this.create && this.state.rel === null) {
            return <span className="has-text-grey-light">Loading...</span>;
        }

        return (
            <>
                {this.state.delete && <DeleteModal delete={this.state.delete} handleConfirm={this.handleDeleteModalConfirm} handleClose={() => this.setState({ delete: false })} />}

                {Array.isArray(this.state.typeModal) && (
                    <Modal title="Set type" handleClose={this.handleTypeModalClose}>
                        <div className="buttons">
                            {this.state.typeModal.map(label => (
                                <Button text={label} color="is-info is-rounded" key={label} onClick={() => this.handleTypeSelect(label)} />
                            ))}
                        </div>
                        <form
                            onSubmit={e => {
                                e.preventDefault();
                                this.handleTypeSelect(this.state.typeModalInput);
                                return true;
                            }}>
                            <label className="label">Or specify new one</label>
                            <div className="field is-grouped">
                                <div className="control is-expanded">
                                    <input autoFocus pattern="^[A-Za-z][A-Za-z_0-9]*$" required className="input" type="text" value={this.state.typeModalInput} onChange={this.handleTypeInput} />
                                </div>
                                <div className="control">
                                    <Button icon="fa-solid fa-check" type="submit" />
                                </div>
                            </div>
                        </form>
                    </Modal>
                )}

                {this.state.selectNodeModal && (
                    <SelectNodeModal
                        stashManager={this.props.stashManager}
                        handleNodeSelect={node => {
                            if (this.state.selectNodeModal === 1) {
                                this.setState({
                                    start: node,
                                    selectNodeModal: null,
                                });
                            } else {
                                this.setState({
                                    end: node,
                                    selectNodeModal: null,
                                });
                            }
                        }}
                        handleClose={() => this.setState({ selectNodeModal: null })}
                        database={this.props.database}
                    />
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
                                                <input className="input is-copyable" disabled type="text" value={db.strId(this.state.rel.identity)} />
                                            </div>
                                        </div>
                                    </div>
                                    {db.hasElementId && (
                                        <div className="column is-half-desktop">
                                            <div className="field">
                                                <label className="label">elementId</label>
                                                <div className="control" onClick={copy}>
                                                    <input className="input is-copyable" disabled type="text" value={this.state.rel.elementId} />
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
                            Type
                        </legend>
                        <div className="buttons tags">
                            {this.state.type && (
                                <span className="tag is-info is-medium mr-3 is-rounded">
                                    <a
                                        className="has-text-white mr-1"
                                        onClick={() => this.props.tabManager.add(this.state.type, "fa-regular fa-circle", EPage.Type, { type: this.state.type, database: this.props.database })}>
                                        {this.state.type}
                                    </a>
                                </span>
                            )}
                            <Button icon="fa-solid fa-pen-clip" onClick={this.handleTypeOpenModal} />
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
                                this.setState({ properties: properties });
                            }}
                        />
                    </fieldset>

                    <fieldset className="box">
                        <legend className="tag is-link is-light">
                            <i className="fa-solid fa-circle-nodes mr-2" />
                            Start node
                        </legend>
                        <div className="is-flex is-align-items-center is-justify-content-flex-start mb-3 mb-last-none">
                            {this.state.start && <InlineNode node={this.state.start} tabManager={this.props.tabManager} />}
                            <span className="ml-auto">
                                <Button icon="fa-solid fa-shuffle" text="Change" onClick={() => this.setState({ selectNodeModal: 1 })} />
                            </span>
                        </div>
                    </fieldset>

                    <fieldset className="box">
                        <legend className="tag is-link is-light">
                            <i className="fa-solid fa-circle-nodes mr-2" />
                            End node
                        </legend>
                        <div className="is-flex is-align-items-center is-justify-content-flex-start mb-3 mb-last-none">
                            {this.state.end && <InlineNode node={this.state.end} tabManager={this.props.tabManager} />}
                            <span className="ml-auto">
                                <Button icon="fa-solid fa-shuffle" text="Change" onClick={() => this.setState({ selectNodeModal: 2 })} />
                            </span>
                        </div>
                    </fieldset>

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
                            {!this.create && this.props.stashManager.button(this.state.rel, this.props.database)}
                            {!this.create && <Button icon="fa-solid fa-refresh" text="Reload" onClick={this.requestData} />}
                            <Button icon="fa-solid fa-xmark" text="Close" onClick={e => this.props.tabManager.close(this.props.tabId, e)} />
                            {!this.create && <Button icon="fa-regular fa-trash-can" color="is-danger" text="Delete" onClick={() => this.setState({ delete: db.getId(this.state.rel) })} />}
                        </div>
                    </div>
                </form>
            </>
        );
    }
}

export default Relationship;
