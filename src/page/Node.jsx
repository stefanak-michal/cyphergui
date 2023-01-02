import React, { Component } from "react";
import { neo4j, getDriver } from "../db";
import Label from "./Label";
import { Property } from "../form";

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
                this.setState({
                    node: response.records[0].get("n"),
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
        const name = e.target.name.substring(4);
        console.log(this.state.node.properties);
        let tmp = { ...this.state.node.properties };
        const value = tmp[name];
        delete tmp[name];
        tmp[e.target.value] = value;
        this.state.node.properties = tmp;
        this.setState({
            node: this.state.node,
            focus: "key." + e.target.value,
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
        this.state.node.properties[e.target.name] = value;
        this.setState({
            node: this.state.node,
        });
    };

    handlePropertyTypeChange = e => {
        const name = e.target.name.substring(5);
        switch (e.target.value) {
            case "bool":
                this.state.node.properties[name] = !!this.state.node.properties[name];
                break;
            case "integer":
                this.state.node.properties[name] = neo4j.int(this.state.node.properties[name]);
                break;
            case "float":
                this.state.node.properties[name] = parseFloat(this.state.node.properties[name]);
                break;
            case "string":
                this.state.node.properties[name] = this.state.node.properties[name].toString();
                break;
        }
        this.setState({
            node: this.state.node,
        });
    };

    handlePropertyDelete = name => {
        delete this.state.node.properties[name];
        this.setState({
            node: this.state.node,
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
                    {Object.keys(this.state.node.properties)
                        .sort()
                        .map(key => (
                            <Property
                                key={key}
                                name={key}
                                focus={this.state.focus}
                                value={this.state.node.properties[key]}
                                onKeyChange={this.handlePropertyKeyChange}
                                onValueChange={this.handlePropertyValueChange}
                                onTypeChange={this.handlePropertyTypeChange}
                                onDelete={this.handlePropertyDelete}
                            />
                        ))}

                    <button className="button">todo add button</button>
                </fieldset>

                <div className="field">
                    <div className="control buttons is-justify-content-flex-end">
                        <button type="submit" className="button is-success">
                            <span className="icon">
                                <i className="fa-solid fa-check"></i>
                            </span>
                            <span>Save</span>
                        </button>
                        <button className="button" onClick={this.requestData}>
                            <span className="icon">
                                <i className="fa-solid fa-refresh"></i>
                            </span>
                            <span>Revert</span>
                        </button>
                    </div>
                </div>
            </form>
        );
    }
}

export default Node;
