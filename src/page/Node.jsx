import React, { Component } from "react";
import { neo4j, getDriver } from "../db";
import Label from "./Label";
import { Button, Property } from "../form";
import Modal from "./block/Modal";

/**
 * Edit node by ID
 */
class Node extends Component {
    constructor(props) {
        super(props);
        this.state = {
            node: null,
            focus: null,
            labels: [],
            properties: [],
            labelModal: false,
            labelModalInput: "",
        };
    }

    requestData = () => {
        getDriver()
            .session({
                database: this.props.database,
                defaultAccessMode: neo4j.session.READ,
            })
            .run("MATCH (n) WHERE id(n) = $i RETURN n", {
                i: this.props.id,
            })
            .then(response => {
                const node = response.records[0].get("n");
                let props = [];
                const t = new Date().getTime();
                for (let key in node.properties) props.push({ name: key + t, key: key, value: node.properties[key] });
                props.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
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
    shouldComponentUpdate(nextProps, nextState, nextContext) {
        if (nextProps.active && this.props.active !== nextProps.active) {
            getDriver()
                .session({
                    database: this.props.database,
                    defaultAccessMode: neo4j.session.READ,
                })
                .run("MATCH (n) WHERE id(n) = $id RETURN COUNT(n) AS c", {
                    id: this.props.id,
                })
                .then(response => {
                    if (neo4j.integer.toNumber(response.records[0].get("c")) !== 1) {
                        this.props.removeTab("Node#" + neo4j.integer.toString(this.props.id));
                    }
                })
                .catch(console.error);
        }
        return true;
    }

    handlePropertyKeyChange = e => {
        this.state.properties.filter(p => "key." + p.name === e.target.name)[0].key = e.target.value;
        this.setState({
            properties: this.state.properties,
            focus: e.target.name,
        });
    };

    handlePropertyValueChange = (e, type) => {
        let value = e.target.value;
        switch (type) {
            case "bool":
                value = e.target.checked;
                break;
            case "integer":
                value = neo4j.int(value);
                break;
            case "float":
                value = parseFloat(value);
                break;
        }
        this.state.properties.filter(p => p.name === e.target.name)[0].value = value;
        this.setState({
            properties: this.state.properties,
            focus: e.target.name,
        });
    };

    handlePropertyTypeChange = e => {
        const i = this.state.properties.findIndex(p => "type." + p.name === e.target.name);
        switch (e.target.value) {
            case "bool":
                this.state.properties[i].value = !!this.state.properties[i].value;
                break;
            case "integer":
                this.state.properties[i].value = neo4j.int(this.state.properties[i].value);
                break;
            case "float":
                this.state.properties[i].value = parseFloat(this.state.properties[i].value);
                break;
            case "string":
                this.state.properties[i].value = this.state.properties[i].value.toString();
                break;
        }
        this.setState({
            properties: this.state.properties,
            focus: e.target.name,
        });
    };

    handlePropertyDelete = name => {
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
        this.state.properties.push({ name: i, key: "", value: "" });
        this.setState({
            properties: this.state.properties,
            focus: "key." + i,
        });
    };

    handleLabelOpenModal = () => {
        getDriver()
            .session({
                database: this.props.database,
                defaultAccessMode: neo4j.session.READ,
            })
            .run("MATCH (n) WITH DISTINCT labels(n) AS ll UNWIND ll AS l RETURN collect(DISTINCT l) AS c")
            .then(response => {
                this.setState({
                    labelModal: response.records[0].get("c").filter(l => this.state.labels.indexOf(l) === -1),
                });
            })
            .catch(console.error);
    };

    handleLabelSelect = label => {
        if (label.length > 0 && this.state.labels.indexOf(label) === -1) {
            this.state.labels.push(label);
            this.setState({
                node: this.state.node,
                labelModal: false,
                labelModalInput: "",
            });
        } else {
            this.setState({
                labelModal: false,
                labelModalInput: "",
            });
        }
    };

    handleLabelDelete = label => {
        const i = this.state.labels.indexOf(label);
        if (i === -1) return;
        this.state.labels.splice(i, 1);
        this.setState({
            node: this.state.node,
        });
    };

    handleLabelModalClose = () => {
        this.setState({
            labelModal: false,
        });
    };

    handleSubmit = e => {
        e.preventDefault();

        let setLabels = this.state.labels.filter(l => this.state.node.labels.indexOf(l) === -1).join(":");
        if (setLabels.length > 0) setLabels = "SET n:" + setLabels;
        let removeLabels = this.state.node.labels.filter(l => this.state.labels.indexOf(l) === -1).join(":");
        if (removeLabels.length > 0) removeLabels = "REMOVE n:" + removeLabels;

        //todo maybe do mutation instead of replace? https://neo4j.com/docs/cypher-manual/current/clauses/set/#set-setting-properties-using-map
        let props = {};
        this.state.properties.map(p => {
            props[p.key] = p.value;
        });

        //todo show query while making modifications in form?
        //todo log query somewhere? create log terminal?
        getDriver()
            .session({
                database: this.props.database,
                defaultAccessMode: neo4j.session.WRITE,
            })
            .run("MATCH (n) WHERE id(n) = $id " + setLabels + " " + removeLabels + " SET n = $p", {
                id: this.props.id,
                p: props,
            })
            .then(response => {
                if (response.summary.counters.containsUpdates()) {
                    this.props.toast("Node updated");
                }
                this.props.removeTab("Node#" + neo4j.integer.toString(this.props.id));
            })
            .catch(console.error);
    };

    render() {
        if (!this.props.active) return;
        document.title = "Node #" + neo4j.integer.toString(this.props.id) + " (db: " + this.props.database + ")";

        if (this.state.node === null) {
            return <span className="has-text-grey-light">Loading...</span>;
        }

        return (
            <>
                {this.state.labelModal !== false && (
                    <Modal title="Add label" handleClose={this.handleLabelModalClose}>
                        <div className="buttons">
                            {this.state.labelModal.map(label => (
                                <Button text={label} color="is-link is-rounded" key={label} onClick={() => this.handleLabelSelect(label)} />
                            ))}
                        </div>
                        <form onSubmit={() => this.handleLabelSelect(this.state.labelModalInput)}>
                            <label className="label">Or specify new one</label>
                            <div className="field is-grouped">
                                <div className="control is-expanded">
                                    <input autoFocus className="input" type="text" value={this.state.labelModalInput} onChange={e => this.setState({ labelModalInput: e.target.value })} />
                                </div>
                                <div className="control">
                                    <Button icon="fa-solid fa-check" type="submit" />
                                </div>
                            </div>
                        </form>
                    </Modal>
                )}

                <form onSubmit={this.handleSubmit}>
                    <div className="columns">
                        <div className="column is-half-desktop">
                            <div className="field">
                                <label className="label">identity</label>
                                <div className="control">
                                    <input className="input" disabled type="text" defaultValue={neo4j.integer.toString(this.state.node.identity)} />
                                </div>
                            </div>
                        </div>
                        <div className="column is-half-desktop">
                            {!!this.state.node.elementId && (
                                <div className="field">
                                    <label className="label">elementId</label>
                                    <div className="control">
                                        <input className="input" disabled type="text" defaultValue={this.state.node.elementId} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <fieldset className="box">
                        <legend className="tag is-dark">
                            <i className="fa-solid fa-tags mr-2"></i>Labels
                        </legend>
                        <div className="buttons tags">
                            {this.state.labels.map(label => (
                                <span className="tag is-link is-medium mr-3 is-rounded">
                                    <a className="has-text-white mr-1" onClick={() => this.props.addTab(label, "fa-regular fa-circle", Label, { label: label, database: this.props.database })}>
                                        {label}
                                    </a>
                                    <button className="delete" onClick={this.handleLabelDelete}></button>
                                </span>
                            ))}
                            <Button icon="fa-solid fa-plus" color="button tag is-medium" onClick={this.handleLabelOpenModal} />
                        </div>
                    </fieldset>

                    <fieldset className="box">
                        <legend className="tag is-dark">
                            <i className="fa-regular fa-rectangle-list mr-2"></i>Properties
                        </legend>
                        {this.state.properties.map(p => (
                            <Property
                                key={p.name}
                                name={p.name}
                                mapKey={p.key}
                                focus={this.state.focus}
                                value={p.value}
                                onKeyChange={this.handlePropertyKeyChange}
                                onValueChange={this.handlePropertyValueChange}
                                onTypeChange={this.handlePropertyTypeChange}
                                onDelete={this.handlePropertyDelete}
                            />
                        ))}

                        <Button icon="fa-solid fa-plus" text="Add property" onClick={this.handlePropertyAdd} />
                    </fieldset>

                    <div className="field">
                        <div className="control buttons is-justify-content-flex-end">
                            <Button color="is-success" type="submit" icon="fa-solid fa-check" text="Save" />
                            <Button icon="fa-solid fa-refresh" text="Reload" onClick={this.requestData} />
                            <Button icon="fa-solid fa-xmark" text="Close" onClick={e => this.props.removeTab("Node#" + neo4j.integer.toString(this.props.id), e)} />
                        </div>
                    </div>
                </form>
            </>
        );
    }
}

export default Node;
