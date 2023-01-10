import * as React from "react";
import db from "../db";
import { EPage, EPropertyType } from "../utils/enums";
import { ITabManager } from "../utils/interfaces";
import { ClipboardContext } from "../utils/contexts";

export class Input extends React.Component<{ label: string; name: string; type?: string; placeholder?: string; value?: any; onChange: (e: React.ChangeEvent) => void; focus?: boolean }> {
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
                        autoFocus={this.props.focus || false}
                    />
                </div>
            </div>
        );
    }
}

export class Checkbox extends React.Component<{ name: string; label: string; color?: string; onChange?: (e: React.ChangeEvent) => void; checked?: boolean; disabled?: boolean; help?: string }> {
    render() {
        return (
            <div className="field">
                <label className={"switch " + (this.props.color || "")}>
                    <input type="checkbox" name={this.props.name} onChange={this.props.onChange} checked={this.props.checked || false} disabled={this.props.disabled || false} />
                    <span className="slider" /> {this.props.label}
                </label>
                {this.props.help && <p className="help">{this.props.help}</p>}
            </div>
        );
    }
}

export class Textarea extends React.Component<
    { name: string; value: string; onChange?: (e: React.ChangeEvent) => void; autoresize?: boolean; focus?: boolean; placeholder?: string },
    { height: number }
> {
    ref = React.createRef<HTMLTextAreaElement>();
    state = {
        height: 0,
    };

    componentDidMount() {
        this.resize();
    }

    componentDidUpdate() {
        this.resize();
    }

    resize = () => {
        if (this.props.autoresize !== false) {
            this.ref.current.style.height = "0px";
            const computed = window.getComputedStyle(this.ref.current);
            this.ref.current.style.height = parseInt(computed.getPropertyValue("border-top-width")) + this.ref.current.scrollHeight + parseInt(computed.getPropertyValue("border-bottom-width")) + "px";
        }
    };

    render() {
        return (
            <textarea
                name={this.props.name}
                className="textarea"
                value={this.props.value}
                onChange={this.props.onChange}
                ref={this.ref}
                autoFocus={this.props.focus || false}
                placeholder={this.props.placeholder}
            />
        );
    }
}

//maybe this should be somewhere else ...it is not really form ..hmm html.tsx?
export class Button extends React.Component<{ text?: string; icon?: string; color?: string; onClick?: (e?: any) => void; type?: "submit" | "reset" | "button"; title?: string; value?: string }> {
    render() {
        return (
            <button className={"button " + (this.props.color || "")} onClick={this.props.onClick} type={this.props.type || "button"} title={this.props.title || ""} value={this.props.value}>
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

export class LabelButton extends React.Component<{ label: string; database: string; size?: string; tabManager: ITabManager }> {
    render() {
        return (
            <Button
                color={"tag is-link is-rounded px-2 " + (this.props.size || "")}
                onClick={() => this.props.tabManager.add(this.props.label, "fa-regular fa-circle", EPage.Label, { label: this.props.label, database: this.props.database })}
                text={":" + this.props.label}
            />
        );
    }
}

export class TypeButton extends React.Component<{ type: string; database: string; size?: string; tabManager: ITabManager }> {
    render() {
        return (
            <Button
                color={"tag is-info is-rounded px-2 " + (this.props.size || "")}
                onClick={() => this.props.tabManager.add(this.props.type, "fa-solid fa-arrow-right-long", EPage.Type, { type: this.props.type, database: this.props.database })}
                text={":" + this.props.type}
            />
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
                        <div className="control is-expanded has-icons-right">
                            <Textarea name={this.props.name} value={this.props.value} onChange={this.props.onValueChange} focus={this.props.focus === this.props.name} placeholder="Value" />
                            <ClipboardContext.Consumer>
                                {copy => (
                                    <span className="icon is-right is-clickable" onClick={copy} data-copy={this.props.value}>
                                        <i className="fa-regular fa-copy"></i>
                                    </span>
                                )}
                            </ClipboardContext.Consumer>
                        </div>
                        {propertyTypeSelect}
                        {deleteButton}
                    </div>
                );
            case EPropertyType.Integer:
                return (
                    <div className="field is-grouped">
                        {nameInput}
                        <div className="control is-expanded has-icons-right">
                            <input
                                name={this.props.name}
                                className="input"
                                type="number"
                                value={db.strId(this.props.value)}
                                step="1"
                                autoFocus={this.props.focus === this.props.name}
                                onChange={this.props.onValueChange}
                                placeholder="Value"
                            />
                            <ClipboardContext.Consumer>
                                {copy => (
                                    <span className="icon is-right is-clickable" onClick={copy} data-copy={db.strId(this.props.value)}>
                                        <i className="fa-regular fa-copy"></i>
                                    </span>
                                )}
                            </ClipboardContext.Consumer>
                        </div>
                        {propertyTypeSelect}
                        {deleteButton}
                    </div>
                );
            case EPropertyType.Float:
                return (
                    <div className="field is-grouped">
                        {nameInput}
                        <div className="control is-expanded has-icons-right">
                            <input
                                name={this.props.name}
                                className="input"
                                type="number"
                                value={this.props.value}
                                onChange={this.props.onValueChange}
                                autoFocus={this.props.focus === this.props.name}
                                placeholder="Value"
                            />
                            <ClipboardContext.Consumer>
                                {copy => (
                                    <span className="icon is-right is-clickable" onClick={copy} data-copy={this.props.value}>
                                        <i className="fa-regular fa-copy"></i>
                                    </span>
                                )}
                            </ClipboardContext.Consumer>
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
