import * as React from "react";
import { neo4j } from "./db";
import { EPropertyType } from "./enums";

export class Input extends React.Component<{ label: string; name: string; type?: string; placeholder?: string; value?: any; onChange: (e: React.ChangeEvent) => void }> {
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
                        value={this.props.value}
                    />
                </div>
            </div>
        );
    }
}

export class Checkbox extends React.Component<{ name: string; label: string; color?: string; onChange?: (e: React.ChangeEvent) => void; checked?: boolean; disabled?: boolean }> {
    render() {
        return (
            <div className="field">
                <label className={"switch " + this.props.color}>
                    <input type="checkbox" name={this.props.name} onChange={this.props.onChange} checked={this.props.checked || false} disabled={this.props.disabled || false} />
                    <span className="slider" /> {this.props.label}
                </label>
            </div>
        );
    }
}

export class Button extends React.Component<{ text?: string; icon?: string; color?: string; onClick?: (e?: any) => void; type?: "submit" | "reset" | "button"; title?: string }> {
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

class PropertyType extends React.Component<{ name: string; selected: EPropertyType; onTypeChange: (e: React.ChangeEvent) => void }> {
    render() {
        return (
            <div className="select">
                <select name={"type." + this.props.name} value={this.props.selected} onChange={this.props.onTypeChange}>
                    {Object.keys(EPropertyType).map(type => (
                        <option key={type} value={type}>
                            {type}
                        </option>
                    ))}
                </select>
            </div>
        );
    }
}

/*
@todo add additional property types (point, datetime, ...)
 */

export class Property extends React.Component<{
    name: string;
    mapKey: string;
    focus: string;
    value: any;
    type: EPropertyType;
    onKeyChange: (e: React.ChangeEvent) => void;
    onValueChange: (e: React.ChangeEvent) => void;
    onTypeChange: (e: React.ChangeEvent) => void;
    onDelete: (name: string) => void;
}> {
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
                    pattern="^[A-Za-z][A-Za-z_0-9]*$"
                    required
                />
            </div>
        );

        const propertyTypeSelect = (
            <div className="control">
                <PropertyType name={this.props.name} selected={this.props.type} onTypeChange={this.props.onTypeChange} />
            </div>
        );

        switch (this.props.type) {
            case EPropertyType.String:
                return (
                    <div className="field is-grouped">
                        {nameInput}
                        <div className="control is-expanded">
                            <textarea
                                name={this.props.name}
                                className="textarea"
                                rows={2}
                                value={this.props.value}
                                onChange={this.props.onValueChange}
                                autoFocus={this.props.focus === this.props.name}
                                placeholder="Value"
                            />
                        </div>
                        {propertyTypeSelect}
                        {deleteButton}
                    </div>
                );
            case EPropertyType.Integer:
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
                                onChange={this.props.onValueChange}
                                placeholder="Value"
                            />
                        </div>
                        {propertyTypeSelect}
                        {deleteButton}
                    </div>
                );
            case EPropertyType.Float:
                return (
                    <div className="field is-grouped">
                        {nameInput}
                        <div className="control is-expanded">
                            <input
                                name={this.props.name}
                                className="input"
                                type="number"
                                value={this.props.value}
                                onChange={this.props.onValueChange}
                                autoFocus={this.props.focus === this.props.name}
                                placeholder="Value"
                            />
                        </div>
                        {propertyTypeSelect}
                        {deleteButton}
                    </div>
                );
            case EPropertyType.Boolean:
                return (
                    <div className="field is-grouped">
                        {nameInput}
                        <div className="control is-expanded">
                            <label className="switch">
                                <input name={this.props.name} type="checkbox" checked={this.props.value} onChange={this.props.onValueChange} placeholder="Value" />
                                <span className="slider" />
                            </label>
                        </div>
                        {propertyTypeSelect}
                        {deleteButton}
                    </div>
                );
        }
    }
}
