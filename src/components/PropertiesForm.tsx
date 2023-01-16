import * as React from "react";
import { t_FormProperty } from "../utils/types";
import { EPropertyType } from "../utils/enums";
import db from "../db";
import { Button, Textarea } from "./form";
import { ClipboardContext } from "../utils/contexts";
import { Date as _Date, Integer, Time as _Time, DateTime as _DateTime, LocalTime as _LocalTime, LocalDateTime as _LocalDateTime } from "neo4j-driver";

interface IPropertiesFormProps {
    properties: t_FormProperty[];
    updateProperties: (properties: t_FormProperty[]) => void;
}

interface IPropertiesFormState {
    focus: string;
}

// todo add additional property types (point, datetime, ...)

class PropertiesForm extends React.Component<IPropertiesFormProps, IPropertiesFormState> {
    state: IPropertiesFormState = {
        focus: "",
    };

    handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const target = e.currentTarget;
        let props = [...this.props.properties];
        const i = props.findIndex(p => "key." + p.name === target.name);
        if (i > -1) {
            props[i].key = target.value;
            this.props.updateProperties(props);
            this.setState({ focus: target.name });
        }
    };

    handleValueChange = (name: string, value: any) => {
        let props = [...this.props.properties];
        let i = props.findIndex(p => p.name === name);
        if (i > -1) {
            props[i].value = value;
        } else {
            i = props.findIndex(p => name.startsWith(p.name));
            if (i > -1) {
                const index = parseInt(name.split(".", 2)[1]);
                props[i].value[index] = value;
            }
        }

        if (i > -1) {
            this.props.updateProperties(props);
            this.setState({ focus: name });
        }
    };

    handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const target = e.currentTarget;
        let props = [...this.props.properties];
        let i = props.findIndex(p => "type." + p.name === target.name);
        if (i > -1) {
            props[i].type = EPropertyType[target.value];
            props[i].value = this.getDefaultValue(EPropertyType[target.value]);
        } else {
            i = props.findIndex(p => "subtype." + p.name === target.name);
            if (i > -1) {
                props[i].subtype = EPropertyType.String;
                (props[i].value as any[]).forEach((v, j) => {
                    props[i].value[j] = this.getDefaultValue(EPropertyType[target.value]);
                });
            }
        }

        if (i > -1) {
            this.props.updateProperties(props);
            this.setState({ focus: target.name });
        }
    };

    getDefaultValue = (type: EPropertyType): any => {
        switch (type) {
            case EPropertyType.String:
                return "";
            case EPropertyType.Boolean:
                return false;
            case EPropertyType.Integer:
                return db.neo4j.int(0);
            case EPropertyType.Float:
                return 0;
            case EPropertyType.List:
                return [];
            case EPropertyType.Time:
                return _Time.fromStandardDate(new Date());
            case EPropertyType.Date:
                return _Date.fromStandardDate(new Date());
            case EPropertyType.DateTime:
                return _DateTime.fromStandardDate(new Date());
            case EPropertyType.LocalTime:
                return _LocalTime.fromStandardDate(new Date());
            case EPropertyType.LocalDateTime:
                return _LocalDateTime.fromStandardDate(new Date());
        }
    };

    handleDelete = (name: string) => {
        let props = [...this.props.properties];
        let i = props.findIndex(p => p.name === name);
        if (i > -1) {
            props.splice(i, 1);
        } else {
            i = props.findIndex(p => name.startsWith(p.name));
            if (i > -1) {
                const index = parseInt(name.split(".", 2)[1]);
                props[i].value.splice(index, 1);
            }
        }

        if (i > -1) this.props.updateProperties(props);
    };

    handleAdd = (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault();
        const target = e.currentTarget;
        let props = [...this.props.properties];
        if (target.value) {
            const i = props.findIndex(p => p.name === target.value);
            if (i > -1) {
                let value: any = "";
                switch (props[i].subtype) {
                    case EPropertyType.Integer:
                        value = db.neo4j.int(0);
                        break;
                    case EPropertyType.Float:
                        value = 0;
                        break;
                    case EPropertyType.Boolean:
                        value = false;
                        break;

                    // todo add additional type classes
                }

                props[i].value.push(value);

                this.props.updateProperties(props);
                this.setState({ focus: props[i].name + "." + (props[i].value.length - 1) });
            }
        } else {
            const i = new Date().getTime().toString();
            props.push({ name: i, key: "", value: "", type: EPropertyType.String, subtype: null });

            this.props.updateProperties(props);
            this.setState({ focus: "key." + i });
        }
    };

    render() {
        return (
            <>
                {this.props.properties.map(p => (
                    <Property
                        key={p.name}
                        focus={this.state.focus}
                        property={p}
                        onKeyChange={this.handleKeyChange}
                        onValueChange={this.handleValueChange}
                        onTypeChange={this.handleTypeChange}
                        onDelete={this.handleDelete}
                        onAdd={this.handleAdd}
                    />
                ))}

                <Button icon="fa-solid fa-plus" color="ml-1" text="Add property" onClick={this.handleAdd} />
            </>
        );
    }
}

class Property extends React.Component<{
    property: t_FormProperty;
    focus: string;
    onKeyChange: (e: React.ChangeEvent) => void;
    onValueChange: (name: string, value: any) => void;
    onTypeChange: (e: React.ChangeEvent) => void;
    onDelete: (name: string) => void;
    onAdd: (e: React.PointerEvent) => void;
}> {
    components = {
        PropertyStringInput: PropertyStringInput,
        PropertyIntegerInput: PropertyIntegerInput,
        PropertyFloatInput: PropertyFloatInput,
        PropertyBooleanInput: PropertyBooleanInput,
        PropertyTimeInput: PropertyTimeInput,
        PropertyDateInput: PropertyDateInput,
        PropertyDateTimeInput: PropertyDateTimeInput,
        PropertyLocalTimeInput: PropertyLocalTimeInput,
        PropertyLocalDateTimeInput: PropertyLocalDateTimeInput,
        PropertyDurationInput: PropertyDurationInput,
        PropertyPointInput: PropertyPointInput,
    };

    render() {
        let deleteButton = (
            <div className="control">
                <Button icon="fa-regular fa-trash-can" onClick={() => this.props.onDelete(this.props.property.name)} title="Delete property" />
            </div>
        );

        const nameInput = (
            <div className="control">
                <input
                    name={"key." + this.props.property.name}
                    autoFocus={this.props.focus === "key." + this.props.property.name}
                    className="input"
                    type="text"
                    value={this.props.property.key}
                    onChange={this.props.onKeyChange}
                    placeholder="Key"
                    pattern="^[A-Za-z][A-Za-z_0-9]*$"
                    required
                />
            </div>
        );

        const propertyTypeSelect = (
            <div className="control">
                <PropertyType name={this.props.property.name} selected={this.props.property.type} onTypeChange={this.props.onTypeChange} subtype={false} />
            </div>
        );

        if (this.props.property.type === EPropertyType.List) {
            return (
                <div className="field is-grouped is-hoverable p-1 mb-1">
                    {nameInput}

                    <div className="control is-expanded">
                        {(this.props.property.value as any[]).map((v, i) => {
                            const PropertyInputComponent: typeof APropertyInput = this.components["Property" + this.props.property.subtype + "Input"];
                            const focus = this.props.focus === this.props.property.name + "." + i;
                            return (
                                <div className="field is-grouped">
                                    <PropertyInputComponent name={this.props.property.name + "." + i} value={v} onValueChange={this.props.onValueChange} focus={focus} />
                                    <Button icon="fa-solid fa-circle-minus" onClick={() => this.props.onDelete(this.props.property.name + "." + i)} title="Remove array entry" />
                                </div>
                            );
                        })}
                        <div className="field">
                            <div className="control">
                                <Button icon="fa-solid fa-circle-plus" onClick={this.props.onAdd} title="Add array entry" value={this.props.property.name} />
                            </div>
                        </div>
                    </div>

                    <div className="control">
                        <div className="field">
                            <div className="control">
                                <PropertyType name={this.props.property.name} selected={this.props.property.type} onTypeChange={this.props.onTypeChange} subtype={false} />
                            </div>
                        </div>
                        <div className="field">
                            <div className="control">
                                <PropertyType name={this.props.property.name} selected={this.props.property.subtype} onTypeChange={this.props.onTypeChange} subtype={true} />
                            </div>
                        </div>
                    </div>

                    {deleteButton}
                </div>
            );
        } else {
            const PropertyInputComponent: typeof APropertyInput = this.components["Property" + this.props.property.type + "Input"];
            return (
                <div className="field is-grouped is-hoverable p-1 mb-1">
                    {nameInput}
                    <PropertyInputComponent
                        name={this.props.property.name}
                        value={this.props.property.value}
                        onValueChange={this.props.onValueChange}
                        focus={this.props.focus === this.props.property.name}
                    />
                    {propertyTypeSelect}
                    {deleteButton}
                </div>
            );
        }
    }
}

class PropertyType extends React.Component<{ name: string; selected: EPropertyType; onTypeChange: (e: React.ChangeEvent) => void; subtype: boolean }> {
    render() {
        return (
            <div className="select">
                <select
                    name={(this.props.subtype ? "subtype." : "type.") + this.props.name}
                    value={this.props.selected}
                    onChange={this.props.onTypeChange}
                    title={this.props.subtype ? "Type of array entries" : "Property type"}>
                    {(this.props.subtype ? Object.keys(EPropertyType).filter(k => k !== EPropertyType.List) : Object.keys(EPropertyType)).map(type => (
                        <option key={type} value={type}>
                            {type}
                        </option>
                    ))}
                </select>
            </div>
        );
    }
}

abstract class APropertyInput extends React.Component<{ name: string; value: any; onValueChange: (name: string, value: any) => void; focus: boolean }> {}

class PropertyStringInput extends APropertyInput {
    render() {
        return (
            <div className="control is-expanded has-icons-right">
                <Textarea
                    name={this.props.name}
                    value={this.props.value}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => this.props.onValueChange(this.props.name, e.currentTarget.value)}
                    focus={this.props.focus}
                    placeholder="Value"
                />
                <ClipboardContext.Consumer>
                    {copy => (
                        <span className="icon is-right is-clickable" onClick={copy}>
                            <i className="fa-regular fa-copy" />
                        </span>
                    )}
                </ClipboardContext.Consumer>
            </div>
        );
    }
}

class PropertyBooleanInput extends APropertyInput {
    render() {
        return (
            <div className="control is-expanded">
                <label className="switch">
                    <input
                        name={this.props.name}
                        type="checkbox"
                        checked={this.props.value}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => this.props.onValueChange(this.props.name, e.currentTarget.checked)}
                        placeholder="Value"
                        autoFocus={this.props.focus}
                    />
                    <span className="slider" />
                </label>
            </div>
        );
    }
}

class PropertyIntegerInput extends APropertyInput {
    render() {
        return (
            <div className="control is-expanded has-icons-right">
                <input
                    name={this.props.name}
                    className="input"
                    type="number"
                    value={db.strId(this.props.value)}
                    step="1"
                    autoFocus={this.props.focus}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => this.props.onValueChange(this.props.name, db.neo4j.int(e.currentTarget.value))}
                    placeholder="Value"
                    min="-9223372036854775808"
                    max="9223372036854775807"
                />
                <ClipboardContext.Consumer>
                    {copy => (
                        <span className="icon is-right is-clickable" onClick={copy}>
                            <i className="fa-regular fa-copy" />
                        </span>
                    )}
                </ClipboardContext.Consumer>
            </div>
        );
    }
}

class PropertyFloatInput extends APropertyInput {
    render() {
        return (
            <div className="control is-expanded has-icons-right">
                <input
                    name={this.props.name}
                    className="input"
                    type="number"
                    value={this.props.value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => this.props.onValueChange(this.props.name, e.currentTarget.valueAsNumber)}
                    autoFocus={this.props.focus}
                    placeholder="Value"
                    min={Number.MIN_VALUE}
                    max={Number.MAX_VALUE}
                />
                <ClipboardContext.Consumer>
                    {copy => (
                        <span className="icon is-right is-clickable" onClick={copy}>
                            <i className="fa-regular fa-copy" />
                        </span>
                    )}
                </ClipboardContext.Consumer>
            </div>
        );
    }
}

class PropertyDateInput extends APropertyInput {
    render() {
        return (
            <div className="control is-expanded has-icons-right">
                <input
                    name={this.props.name}
                    className="input"
                    type="date"
                    value={this.props.value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => this.props.onValueChange(this.props.name, _Date.fromStandardDate(e.currentTarget.valueAsDate))}
                    autoFocus={this.props.focus}
                    placeholder="Value"
                />
                + timezone
                <ClipboardContext.Consumer>
                    {copy => (
                        <span className="icon is-right is-clickable" onClick={copy}>
                            <i className="fa-regular fa-copy" />
                        </span>
                    )}
                </ClipboardContext.Consumer>
            </div>
        );
    }
}

class PropertyTimeInput extends APropertyInput {
    timezoneRef = React.createRef<HTMLSelectElement>();
    nanosecondsRef = React.createRef<HTMLInputElement>();
    timeRef = React.createRef<HTMLInputElement>();

    handleChange = () => {
        const date = this.timeRef.current.valueAsDate;
        const t = new _Time(date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), this.nanosecondsRef.current.valueAsNumber, parseInt(this.timezoneRef.current.value) * 60 * 60);
        this.props.onValueChange(this.props.name, t);
    };

    render() {
        let range = [];
        for (let i = -11; i <= 12; i++) range.push(i);
        const value = (this.props.value as _Time).toString();
        const time = value.substring(0, 8);
        const tz = parseFloat(db.neo4j.integer.toString((this.props.value as _Time).timeZoneOffsetSeconds)) / 60 / 60;

        return (
            <div className="control is-expanded">
                <div className="field has-addons">
                    <div className="control is-expanded">
                        <input
                            name={this.props.name}
                            className="input"
                            type="time"
                            value={time}
                            onChange={this.handleChange}
                            autoFocus={this.props.focus}
                            placeholder="Value"
                            step="1"
                            ref={this.timeRef}
                        />
                    </div>
                    <div className="control">
                        <input
                            className="input"
                            placeholder="Nanoseconds"
                            type="number"
                            step="1"
                            min="0"
                            max="999999999"
                            value={db.neo4j.integer.toString((this.props.value as _Time).nanosecond)}
                            title="Nanoseconds"
                            ref={this.nanosecondsRef}
                            onChange={this.handleChange}
                        />
                    </div>
                    <div className="control">
                        <div className="select">
                            <select ref={this.timezoneRef} name={"timezone." + this.props.name} value={tz} onChange={this.handleChange}>
                                {range.map((offset, i) => (
                                    <option key={i} value={offset}>
                                        {(offset >= 0 ? "+" : "-") + Math.abs(offset).toString().padStart(2, "0") + ":00"}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="control">
                        <ClipboardContext.Consumer>{copy => <Button icon="fa-regular fa-copy" onClick={copy} value={value} />}</ClipboardContext.Consumer>
                    </div>
                </div>
            </div>
        );
    }
}

class PropertyDateTimeInput extends APropertyInput {
    render() {
        return (
            <div className="control is-expanded has-icons-right">
                <input
                    name={this.props.name}
                    className="input"
                    type="datetime-local"
                    value={this.props.value}
                    /*onChange={this.props.onValueChange}*/ autoFocus={this.props.focus}
                    placeholder="Value"
                />{" "}
                +timezone
                <ClipboardContext.Consumer>
                    {copy => (
                        <span className="icon is-right is-clickable" onClick={copy}>
                            <i className="fa-regular fa-copy" />
                        </span>
                    )}
                </ClipboardContext.Consumer>
            </div>
        );
    }
}

class PropertyLocalTimeInput extends APropertyInput {
    render() {
        return (
            <div className="control is-expanded has-icons-right">
                <input name={this.props.name} className="input" type="time" value={this.props.value} /*onChange={this.props.onValueChange}*/ autoFocus={this.props.focus} placeholder="Value" />
                <ClipboardContext.Consumer>
                    {copy => (
                        <span className="icon is-right is-clickable" onClick={copy}>
                            <i className="fa-regular fa-copy" />
                        </span>
                    )}
                </ClipboardContext.Consumer>
            </div>
        );
    }
}

class PropertyLocalDateTimeInput extends APropertyInput {
    render() {
        return (
            <div className="control is-expanded has-icons-right">
                <input
                    name={this.props.name}
                    className="input"
                    type="datetime-local"
                    value={this.props.value}
                    /*onChange={this.props.onValueChange}*/ autoFocus={this.props.focus}
                    placeholder="Value"
                />
                <ClipboardContext.Consumer>
                    {copy => (
                        <span className="icon is-right is-clickable" onClick={copy}>
                            <i className="fa-regular fa-copy" />
                        </span>
                    )}
                </ClipboardContext.Consumer>
            </div>
        );
    }
}

class PropertyDurationInput extends APropertyInput {
    render() {
        return <div className="control is-expanded">todo</div>;
    }
}

class PropertyPointInput extends APropertyInput {
    render() {
        return <div className="control is-expanded">todo</div>;
    }
}

export default PropertiesForm;
