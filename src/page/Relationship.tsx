import * as React from "react";
import { IPageProps } from "../interfaces";
import { Integer, Node as Neo4jNode, Relationship as Neo4jRelationship } from "neo4j-driver";
import { EPage, EPropertyType } from "../enums";
import Modal, { DeleteModal } from "./block/Modal";
import { Button, Property } from "../form";
import db from "../db";

interface IRelationshipProps extends IPageProps {
    database: string;
    type: string;
    id: Integer | string;
}

interface IRelationshipState {
    rel: Neo4jRelationship | null;
    start: Neo4jNode | null;
    end: Neo4jNode | null;
    focus: string | null;
    type: string;
    properties: { name: string; key: string; value: any; type: EPropertyType }[];
    typeModal: false | string[];
    typeModalInput: string;
    error: string | null;
    delete: Integer | string | false;
}

/**
 * Edit relationship by ID
 * @todo
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
    };

    requestData = () => {
        if (!this.props.id) return;
        db.getDriver()
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

                const rel: Neo4jRelationship = response.records[0].get("r");
                let props = [];
                const t = new Date().getTime();
                for (let key in rel.properties) {
                    //resolve property type
                    let type = EPropertyType.String;
                    if (typeof rel.properties[key] === "number") type = EPropertyType.Float;
                    else if (db.isInteger(rel.properties[key])) type = EPropertyType.Integer;
                    else if (typeof rel.properties[key] === "boolean") type = EPropertyType.Boolean;
                    else if (Array.isArray(rel.properties[key])) type = EPropertyType.List;
                    props.push({ name: key + t, key: key, value: rel.properties[key], type: type });
                }
                props.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
                this.setState({
                    rel: rel,
                    start: response.records[0].get("a") as Neo4jNode,
                    end: response.records[0].get("b") as Neo4jNode,
                    type: rel.type,
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
    shouldComponentUpdate(nextProps: Readonly<IRelationshipProps>) {
        if (this.props.id && nextProps.active && this.props.active !== nextProps.active) {
            db.getDriver()
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

    handleTypeOpenModal = () => {
        db.getDriver()
            .session({
                database: this.props.database,
                defaultAccessMode: db.neo4j.session.READ,
            })
            .run("MATCH ()-[r]->() RETURN collect(DISTINCT type(r)) AS c")
            .then(response => {
                this.setState({
                    typeModal: response.records[0].get("c").filter(l => this.state.type !== l),
                });
            })
            .catch(console.error);
    };

    handleTypeSelect = (label: string) => {
        this.setState({
            type: label,
            typeModal: false,
            typeModalInput: "",
        });
    };

    handleTypeModalClose = () => {
        this.setState({
            typeModal: false,
        });
    };

    handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        //todo
    };

    handleDeleteModalConfirm = (id: Integer | string) => {
        db.getDriver()
            .session({
                database: this.props.database,
                defaultAccessMode: db.neo4j.session.WRITE,
            })
            .run("MATCH ()-[r]-() WHERE " + db.fnId("r") + " = $id DELETE r", {
                id: id,
            })
            .then(response => {
                if (response.summary.counters.updates().nodesDeleted > 0) {
                    this.requestData();
                    this.props.tabManager.close(db.strId(id) + this.props.database);
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
        if (!this.props.active) return;
        document.title = this.props.tabName + " (db: " + this.props.database + ")";

        if (this.props.id && this.state.rel === null) {
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
                                    <input
                                        autoFocus
                                        pattern="^[A-Za-z][A-Za-z_0-9]*$"
                                        required
                                        className="input"
                                        type="text"
                                        value={this.state.typeModalInput}
                                        onChange={e => this.setState({ typeModalInput: e.currentTarget.value })}
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
                                        <input className="input" disabled type="text" value={db.neo4j.integer.toString(this.state.rel.identity)} />
                                    </div>
                                </div>
                            </div>
                            <div className="column is-half-desktop">
                                {this.props.settings.showElementId && db.hasElementId && (
                                    <div className="field">
                                        <label className="label">elementId</label>
                                        <div className="control">
                                            <input className="input" disabled type="text" value={this.state.rel.elementId} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <fieldset className="box">
                        <legend className="tag is-link is-light">
                            <i className="fa-solid fa-tags mr-2"></i>Type
                        </legend>
                        <div className="buttons tags">
                            <span className="tag is-info is-medium mr-3 is-rounded">
                                <a
                                    className="has-text-white mr-1"
                                    onClick={() => this.props.tabManager.add(this.state.type, "fa-regular fa-circle", EPage.Type, { type: this.state.type, database: this.props.database })}>
                                    {this.state.type}
                                </a>
                            </span>
                            <Button icon="fa-solid fa-pen-clip" color="button tag is-medium" onClick={this.handleTypeOpenModal} />
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

                    <fieldset className="box">
                        <legend className="tag is-link is-light">
                            <i className="fa-solid fa-circle-nodes mr-2"></i>Start node
                        </legend>
                        todo
                    </fieldset>

                    <fieldset className="box">
                        <legend className="tag is-link is-light">
                            <i className="fa-solid fa-circle-nodes mr-2"></i>End node
                        </legend>
                        todo
                    </fieldset>

                    <div className="mb-3">
                        <span className="icon-text is-flex-wrap-nowrap">
                            <span className="icon">
                                <i className="fa-solid fa-terminal" aria-hidden="true"></i>
                            </span>
                            <span className="is-family-code">todo query</span>
                        </span>
                    </div>

                    <div className="field">
                        <div className="control buttons is-justify-content-flex-end">
                            <Button color="is-success" type="submit" icon="fa-solid fa-check" text="Execute" />
                            {this.props.id && this.props.stashManager.button(this.state.rel, this.props.database)}
                            {this.props.id && <Button icon="fa-solid fa-refresh" text="Reload" onClick={this.requestData} />}
                            <Button icon="fa-solid fa-xmark" text="Close" onClick={e => this.props.tabManager.close(this.props.tabId, e)} />
                            {this.props.id && (
                                <Button
                                    icon="fa-regular fa-trash-can"
                                    color="is-danger"
                                    text="Delete"
                                    onClick={() => this.setState({ delete: db.hasElementId ? this.state.rel.elementId : this.state.rel.identity })}
                                />
                            )}
                        </div>
                    </div>
                </form>
            </>
        );
    }
}

export default Relationship;
