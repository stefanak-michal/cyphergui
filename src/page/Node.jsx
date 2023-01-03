import React, { Component } from "react";
import { neo4j, getDriver } from "../db";
import Label from "./Label";
import { Button, Property } from "../form";

/**
 * Edit node by ID
 * @todo
 */
class Node extends Component {
    constructor(props) {
        super(props);
        this.state = {
            node: null,
            focus: null,
            properties: [],
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
                this.setState({
                    node: node,
                    properties: props,
                });
            })
            .catch(error => {
                console.error(error);
            });
    };

    componentDidMount() {
        this.requestData();
    }

    // shouldComponentUpdate(nextProps, nextState, nextContext) {
    //     if (nextProps.active && this.props.active !== nextProps.active) {
    //         this.requestData();
    //     }
    //     return true;
    // }

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

    handleSubmit = e => {
        e.preventDefault();
        console.log(this.state.node);
    };

    render() {
        if (!this.props.active) return;
        document.title = "Node #" + this.props.id + " (db: " + this.props.database + ")";

        if (this.state.node === null) {
            return <span className="has-text-grey-light">Loading...</span>;
        }

        return (
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

                <div className="field mb-6">
                    <label className="label">Labels @todo add new</label>
                    <div className="control buttons are-small">
                        {this.state.node.labels.map(label => (
                            <div className="tags has-addons">
                                <a
                                    className="tag is-link"
                                    onClick={() =>
                                        this.props.addTab(label, "fa-regular fa-circle", Label, {
                                            label: label,
                                            database: this.props.database,
                                        })
                                    }>
                                    {label}
                                </a>
                                <a className="tag is-delete" onClick={() => window.alert("todo")}></a>
                            </div>
                        ))}
                    </div>
                </div>

                <fieldset className="box">
                    <legend className="tag is-dark">Properties</legend>
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
                        <Button icon="fa-solid fa-refresh" text="Revert" onClick={this.requestData} />
                    </div>
                </div>
            </form>
        );
    }
}

export default Node;
