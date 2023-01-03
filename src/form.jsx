import React, { Component } from "react";
import { neo4j } from "./db";

export class Input extends Component {
    render() {
        return (
            <div className="field">
                <label className="label">{this.props.label}</label>
                <div className="control">
                    <input
                        className="input"
                        name={this.props.name}
                        type={this.props.type || "text"}
                        placeholder={this.props.placeholder || ""}
                        onChange={this.props.onChange}
                        defaultValue={this.props.value}
                    />
                </div>
            </div>
        );
    }
}

export class Checkbox extends Component {
    render() {
        return (
            <div className="field">
                <label className={"switch " + (this.props.color || "")}>
                    <input type="checkbox" name={this.props.name} onChange={this.props.onChange} defaultChecked={this.props.checked || false} defaultValue={this.props.value || ""} />
                    <span className="slider" /> {this.props.label}
                </label>
            </div>
        );
    }
}

export class Button extends Component {
    render() {
        return (
            <button className={"button " + (this.props.color || "")} onClick={this.props.onClick} type={this.props.type || "button"} title={this.props.title || ""}>
                {this.props.icon && (
                    <span className="icon">
                        <i className={this.props.icon} />
                    </span>
                )}
                {this.props.text && <span>{this.props.text}</span>}
            </button>
        );
    }
}

class PropertyType extends Component {
    constructor(props) {
        super(props);
        this.state = {
            types: ["string", "integer", "float", "bool"],
        };
    }

    render() {
        return (
            <div className="select">
                <select name={"type." + this.props.name} value={this.props.selected} onChange={this.props.onTypeChange}>
                    {this.state.types.map(type => (
                        <option key={type}>{type}</option>
                    ))}
                </select>
            </div>
        );
    }
}

/*
@todo add additional property types (point, datetime, ...)
 */

export class Property extends Component {
    render() {
        let deleteButton;
        if (!!this.props.onDelete) {
            deleteButton = (
                <div className="control">
                    <Button icon="fa-regular fa-trash-can" onClick={() => this.props.onDelete(this.props.name)} />
                </div>
            );
        }

        const nameInput = (
            <div className="control">
                <input
                    name={"key." + this.props.name}
                    autoFocus={this.props.focus === "key." + this.props.name}
                    className="input"
                    type="text"
                    value={this.props.mapKey}
                    onChange={this.props.onKeyChange}
                    placeholder="Key"
                />
            </div>
        );

        if (typeof this.props.value === "object" && this.props.value.hasOwnProperty("low") && this.props.value.hasOwnProperty("high")) {
            return (
                <div className="field is-grouped">
                    {nameInput}
                    <div className="control is-expanded">
                        <input
                            name={this.props.name}
                            className="input"
                            type="number"
                            value={neo4j.integer.toString(this.props.value)}
                            step="1"
                            autoFocus={this.props.focus === this.props.name}
                            onChange={e => this.props.onValueChange(e, "integer")}
                            placeholder="Value"
                        />
                    </div>
                    <div className="control">
                        <PropertyType name={this.props.name} selected="integer" onTypeChange={this.props.onTypeChange} />
                    </div>
                    {deleteButton}
                </div>
            );
        } else if (typeof this.props.value === "string") {
            return (
                <div className="field is-grouped">
                    {nameInput}
                    <div className="control is-expanded">
                        <textarea
                            name={this.props.name}
                            className="textarea"
                            rows="2"
                            value={this.props.value}
                            onChange={e => this.props.onValueChange(e, "string")}
                            autoFocus={this.props.focus === this.props.name}
                            placeholder="Value"
                        />
                    </div>
                    <div className="control">
                        <PropertyType name={this.props.name} selected="string" onTypeChange={this.props.onTypeChange} />
                    </div>
                    {deleteButton}
                </div>
            );
        } else if (typeof this.props.value === "boolean") {
            return (
                <div className="field is-grouped">
                    {nameInput}
                    <div className="control is-expanded">
                        <label className="switch">
                            <input name={this.props.name} type="checkbox" checked={this.props.value} onChange={e => this.props.onValueChange(e, "bool")} placeholder="Value" />
                            <span className="slider" />
                        </label>
                    </div>
                    <div className="control">
                        <PropertyType name={this.props.name} selected="bool" onTypeChange={this.props.onTypeChange} />
                    </div>
                    {deleteButton}
                </div>
            );
        } else if (typeof this.props.value === "number") {
            return (
                <div className="field is-grouped">
                    {nameInput}
                    <div className="control is-expanded">
                        <input
                            name={this.props.name}
                            className="input"
                            type="number"
                            value={this.props.value}
                            onChange={e => this.props.onValueChange(e, "float")}
                            autoFocus={this.props.focus === this.props.name}
                            placeholder="Value"
                        />
                    </div>
                    <div className="control">
                        <PropertyType name={this.props.name} selected="float" onTypeChange={this.props.onTypeChange} />
                    </div>
                    {deleteButton}
                </div>
            );
        }
    }
}
