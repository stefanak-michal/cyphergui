import * as React from "react";
import { t_FormProperty, t_FormValue } from "../utils/types";
import { Ecosystem, EPropertyType } from "../utils/enums";
import db from "../db";
import { Button, Textarea } from "./form";
import { ClipboardContext } from "../utils/contexts";
import {
    Date as _Date,
    DateTime as _DateTime,
    Duration as _Duration,
    LocalDateTime as _LocalDateTime,
    LocalTime as _LocalTime,
    Point as _Point,
    Time as _Time
} from "neo4j-driver";
import { getPropertyAsTemp, stringToDuration } from "../utils/fn";

interface IPropertiesFormProps {
    properties: t_FormProperty[];
    updateProperties: (properties: t_FormProperty[]) => void;
}

interface IPropertiesFormState {
    focus: string;
}

class PropertiesForm extends React.Component<IPropertiesFormProps, IPropertiesFormState> {
    state: IPropertiesFormState = {
        focus: "",
    };

    handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const target = e.currentTarget;
        let props = [...this.props.properties];
        const i = props.findIndex(p => target.name.startsWith("key." + p.name));
        if (i > -1) {
            const parts = target.name.split('.');
            if (parts.length === 3) {
                (props[i].value[parseInt(parts[2])] as t_FormValue).key = target.value;
            } else {
                props[i].key = target.value;
            }

            this.props.updateProperties(props);
            this.setState({ focus: target.name });
        }
    };

    handleValueChange = (name: string, value: any, temp: any = null) => {
        let props = [...this.props.properties];
        let i = props.findIndex(p => p.name === name);
        if (i > -1) {
            props[i].temp = temp;
            props[i].value = value;
        } else {
            i = props.findIndex(p => name.startsWith(p.name));
            if (i > -1) {
                const index = parseInt(name.split(".", 2)[1]);
                (props[i].value as t_FormValue[])[index].value = value;
                (props[i].value as t_FormValue[])[index].temp = temp;
            }
        }

        if (i > -1) {
            this.props.updateProperties(props);
            this.setState({ focus: name });
        }
    };

    handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const target = e.currentTarget;
        const value = this.getDefaultValue(EPropertyType[target.value]);
        const temp = getPropertyAsTemp(EPropertyType[target.value], value);
        let props = [...this.props.properties];
        let i = props.findIndex(p => "type." + p.name === target.name);
        if (i > -1) {
            if (Array.isArray(value)) value.push({ type: EPropertyType.String, value: "" } as t_FormValue);
            props[i].type = EPropertyType[target.value];
            props[i].value = value;
            props[i].temp = temp;
        } else {
            i = props.findIndex(p => target.name.startsWith("subtype." + p.name));
            if (i > -1) {
                const arr: string[] = target.name.split('.');
                if (arr.length === 2) { //List
                    (props[i].value as t_FormValue[]).forEach((entry: t_FormValue) => {
                        entry.type = EPropertyType[target.value];
                        entry.value = value;
                        entry.temp = temp;
                    });
                } else if (arr.length === 3) { //Map
                    (props[i].value as t_FormValue[])[parseInt(arr[2])].type = EPropertyType[target.value];
                    (props[i].value as t_FormValue[])[parseInt(arr[2])].value = value;
                    (props[i].value as t_FormValue[])[parseInt(arr[2])].temp = temp;
                }
            }
        }

        if (i > -1) {
            this.props.updateProperties(props);
            this.setState({ focus: target.name });
        }
    };

    getDefaultValue = (type: EPropertyType): any => {
        const int0 = db.toInt(0);
        switch (type) {
            case EPropertyType.String:
                return "";
            case EPropertyType.Boolean:
                return false;
            case EPropertyType.Integer:
                return int0;
            case EPropertyType.Float:
                return 0;
            case EPropertyType.List:
            case EPropertyType.Map:
                return [] as t_FormValue[];
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
            case EPropertyType.Point:
                return new _Point(int0, 0, 0, 0);
            case EPropertyType.Duration:
                return new _Duration(int0, int0, int0, int0);
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
                (props[i].value as t_FormValue[]).splice(index, 1);
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
                const valueType = (props[i].value as t_FormValue[])[props[i].value.length - 1].type;
                const value = this.getDefaultValue(valueType);
                (props[i].value as t_FormValue[]).push({ type: valueType, value: value, temp: getPropertyAsTemp(valueType, value) } as t_FormValue);
                this.props.updateProperties(props);
                this.setState({ focus: props[i].name + "." + (props[i].value.length - 1) });
            }
        } else {
            const i = new Date().getTime().toString();
            props.push({ name: i, key: "", value: "", type: EPropertyType.String });

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
    onValueChange: (name: string, value: any, temp?: any) => void;
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

        if (this.props.property.type === EPropertyType.List) {
            return (
                <div className="field is-grouped is-hoverable p-1 mb-1">
                    {nameInput}

                    <div className="control is-expanded">
                        <div className="field is-grouped">
                            <div className="control">
                                <PropertyType name={this.props.property.name} selected={this.props.property.type} onTypeChange={this.props.onTypeChange} subtype={false} />
                            </div>
                            <div className="control">
                                <PropertyType name={this.props.property.name} selected={(this.props.property.value as t_FormValue[])[0]?.type ?? EPropertyType.String} onTypeChange={this.props.onTypeChange} subtype={true} />
                            </div>
                            <div className="control">
                                <ClipboardContext.Consumer>
                                    {copy =>
                                        <Button icon="fa-regular fa-copy" onClick={copy} value={JSON.stringify((this.props.property.value as t_FormValue[]).map(v => db.isInt(v.value) ? db.fromInt(v.value) : v.value))}/>
                                    }
                                </ClipboardContext.Consumer>
                            </div>
                        </div>

                        {(this.props.property.value as t_FormValue[]).map((v, i) => {
                            const PropertyInputComponent: typeof APropertyInput = this.components["Property" + v.type + "Input"];
                            const focus = this.props.focus === this.props.property.name + "." + i;
                            return (
                                <div className="field is-grouped" key={i}>
                                    <PropertyInputComponent
                                        name={this.props.property.name + "." + i}
                                        value={v.value}
                                        temp={v.temp}
                                        onValueChange={this.props.onValueChange}
                                        focus={focus}
                                    />
                                    <Button icon="fa-solid fa-circle-minus" onClick={() => this.props.onDelete(this.props.property.name + "." + i)} title="Remove list entry" />
                                </div>
                            );
                        })}
                        <div className="field">
                            <div className="control">
                                <Button icon="fa-solid fa-circle-plus" onClick={this.props.onAdd} title="Add list entry" value={this.props.property.name} />
                            </div>
                        </div>
                    </div>

                    {deleteButton}
                </div>
            );
        }

        if (this.props.property.type === EPropertyType.Map) {
            return (
                <div className="field is-grouped is-hoverable p-1 mb-1">
                    {nameInput}

                    <div className="control is-expanded">
                        <div className="field is-grouped">
                            <div className="control">
                                <PropertyType name={this.props.property.name} selected={this.props.property.type} onTypeChange={this.props.onTypeChange} subtype={false} />
                            </div>
                            <div className="control">
                                <ClipboardContext.Consumer>
                                    {copy =>
                                        <Button icon="fa-regular fa-copy" onClick={(e) => {
                                            const obj = {};
                                            (this.props.property.value as t_FormValue[]).forEach(v => {
                                                obj[v.key] = db.isInt(v.value) ? db.fromInt(v.value) : v.value;
                                            });
                                            e.currentTarget.value = JSON.stringify(obj);
                                            copy(e);
                                        }}/>
                                    }
                                </ClipboardContext.Consumer>
                            </div>
                        </div>

                        {(this.props.property.value as t_FormValue[]).map((v, i) => {
                            const PropertyInputComponent: typeof APropertyInput = this.components["Property" + v.type + "Input"];
                            const focus = this.props.focus === this.props.property.name + "." + i;
                            return (
                                <div className="field is-grouped" key={i}>
                                    <div className="control">
                                        <input
                                            name={"key." + this.props.property.name + "." + i}
                                            autoFocus={this.props.focus === "key." + this.props.property.name + "." + i}
                                            className="input"
                                            type="text"
                                            value={v.key}
                                            onChange={this.props.onKeyChange}
                                            placeholder="Key"
                                            pattern="^[A-Za-z][A-Za-z_0-9]*$"
                                            required
                                        />
                                    </div>
                                    <PropertyInputComponent
                                        name={this.props.property.name + "." + i}
                                        value={v.value}
                                        temp={v.temp}
                                        onValueChange={this.props.onValueChange}
                                        focus={focus}
                                    />
                                    <div className="control">
                                        <Button icon="fa-solid fa-circle-minus" onClick={() => this.props.onDelete(this.props.property.name + "." + i)} title="Remove map entry" />
                                    </div>
                                    <PropertyType name={this.props.property.name + "." + i} selected={v.type} onTypeChange={this.props.onTypeChange} subtype={true} />
                                </div>
                            );
                        })}
                        <div className="field">
                            <div className="control">
                                <Button icon="fa-solid fa-circle-plus" onClick={this.props.onAdd} title="Add map entry" value={this.props.property.name} />
                            </div>
                        </div>
                    </div>

                    {deleteButton}
                </div>
            );
        }

        const PropertyInputComponent: typeof APropertyInput = this.components["Property" + this.props.property.type + "Input"];
        return (
            <div className="field is-grouped is-hoverable p-1 mb-1">
                {nameInput}
                <PropertyInputComponent
                    name={this.props.property.name}
                    value={this.props.property.value}
                    temp={this.props.property.temp}
                    onValueChange={this.props.onValueChange}
                    focus={this.props.focus === this.props.property.name}
                />
                <div className="control">
                    <PropertyType name={this.props.property.name} selected={this.props.property.type} onTypeChange={this.props.onTypeChange} subtype={false} />
                </div>
                {deleteButton}
            </div>
        );
    }
}

class PropertyType extends React.Component<{ name: string; selected: EPropertyType; onTypeChange: (e: React.ChangeEvent) => void; subtype: boolean }> {
    getPropertyTypes = () => {
        return Object.keys(EPropertyType).filter(k => {
            if (this.props.subtype && (k === EPropertyType.List || k === EPropertyType.Map)) return false;
            if (db.ecosystem === Ecosystem.Memgraph && (k === EPropertyType.Point || k === EPropertyType.Time || k === EPropertyType.DateTime)) return false;
            if (db.ecosystem === Ecosystem.Neo4j && k === EPropertyType.Map) return false;
            return true;
        });
    }

    render() {
        return (
            <div className="select">
                <select
                    name={(this.props.subtype ? "subtype." : "type.") + this.props.name}
                    value={this.props.selected}
                    onChange={this.props.onTypeChange}
                    title={this.props.subtype ? "Type of list/map entries" : "Property type"}>
                    {this.getPropertyTypes().map(type => (
                        <option key={type} value={type}>
                            {type}
                        </option>
                    ))}
                </select>
            </div>
        );
    }
}

abstract class APropertyInput extends React.Component<{
    name: string;
    value: any;
    temp: any;
    onValueChange: (name: string, value: any, temp?: any) => void;
    focus: boolean
}> {}

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
                    value={this.props.temp}
                    step="1"
                    autoFocus={this.props.focus}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => this.props.onValueChange(this.props.name, e.currentTarget.value.length ? db.toInt(e.currentTarget.value) : null, e.currentTarget.value)}
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

class PropertyFloatInput extends APropertyInput {
    render() {
        return (
            <div className="control is-expanded has-icons-right">
                <input
                    name={this.props.name}
                    className="input"
                    type="number"
                    value={this.props.temp}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => this.props.onValueChange(this.props.name, e.currentTarget.valueAsNumber || null, e.currentTarget.value)}
                    autoFocus={this.props.focus}
                    placeholder="Value"
                    step="any"
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

/*
 * Temporal types - part controls
 */

class TimeControl extends React.Component<{ value: string; handleChange: () => void; inputRef: React.RefObject<HTMLInputElement>; invalid?: boolean }> {
    render() {
        return (
            <div className="control is-expanded">
                <input
                    className={"input " + (this.props.invalid ? "is-danger" : "")}
                    type="time"
                    value={this.props.value}
                    onChange={this.props.handleChange}
                    step="1"
                    ref={this.props.inputRef}
                    title="Time"
                />
            </div>
        );
    }
}

class NanosecondsControl extends React.Component<{ value: string; handleChange: () => void; inputRef: React.RefObject<HTMLInputElement>; invalid?: boolean }> {
    render() {
        return (
            <div className="control">
                <input
                    className={"input " + (this.props.invalid ? "is-danger" : "")}
                    type="number"
                    step="1"
                    min="0"
                    max="999999999"
                    value={this.props.value}
                    title="Nanoseconds"
                    ref={this.props.inputRef}
                    onChange={this.props.handleChange}
                />
            </div>
        );
    }
}

class DateControl extends React.Component<{ value: string; handleChange: () => void; inputRef: React.RefObject<HTMLInputElement>; invalid?: boolean }> {
    render() {
        return (
            <div className="control is-expanded">
                <input
                    className={"input " + (this.props.invalid ? "is-danger" : "")}
                    type="date"
                    value={this.props.value}
                    onChange={this.props.handleChange}
                    step="1"
                    ref={this.props.inputRef}
                    title="Date"
                />
            </div>
        );
    }
}

class TimezoneControl extends React.Component<{ value: number; handleChange: () => void; selectRef: React.RefObject<HTMLSelectElement>; invalid?: boolean }, any> {
    render() {
        let range = [];
        for (let i = -11; i <= 12; i++) range.push(i);

        return (
            <div className="control">
                <div className={"select " + (this.props.invalid ? "is-danger" : "")}>
                    <select ref={this.props.selectRef} value={this.props.value} onChange={this.props.handleChange}>
                        {range.map((offset, i) => (
                            <option key={i} value={offset}>
                                {(offset >= 0 ? "+" : "-") + Math.abs(offset).toString().padStart(2, "0") + ":00"}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        );
    }
}

/*
 * Temporal types
 */

class PropertyDateInput extends APropertyInput {
    state = {
        valid: true,
    };

    dateRef = React.createRef<HTMLInputElement>();

    handleChange = () => {
        const valid = this.dateRef.current.valueAsDate !== null;
        this.props.onValueChange(
            this.props.name,
            valid ? new _Date(this.dateRef.current.valueAsDate.getUTCFullYear(), this.dateRef.current.valueAsDate.getUTCMonth() + 1, this.dateRef.current.valueAsDate.getUTCDate()) : null,
            this.dateRef.current.value
        );
        this.setState({ valid: valid });
    };

    componentDidMount() {
        this.setState({
            valid: this.dateRef.current.valueAsDate !== null,
        });
    }

    render() {
        return (
            <div className="control is-expanded">
                <div className="field has-addons">
                    <DateControl value={this.props.temp} handleChange={this.handleChange} inputRef={this.dateRef} invalid={!this.state.valid} />
                    {this.state.valid && (
                        <div className="control">
                            <ClipboardContext.Consumer>{copy => <Button icon="fa-regular fa-copy" onClick={copy} value={this.props.temp} />}</ClipboardContext.Consumer>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

class PropertyTimeInput extends APropertyInput {
    state = {
        valid: true,
    };

    timezoneRef = React.createRef<HTMLSelectElement>();
    nanosecondsRef = React.createRef<HTMLInputElement>();
    timeRef = React.createRef<HTMLInputElement>();

    handleChange = () => {
        const valid = this.timeRef.current.valueAsDate !== null;
        this.props.onValueChange(
            this.props.name,
            valid
                ? new _Time(
                      this.timeRef.current.valueAsDate.getUTCHours(),
                      this.timeRef.current.valueAsDate.getUTCMinutes(),
                      this.timeRef.current.valueAsDate.getUTCSeconds(),
                      this.nanosecondsRef.current.valueAsNumber,
                      parseInt(this.timezoneRef.current.value) * 60 * 60
                  )
                : null,
            [this.timeRef.current.value, this.nanosecondsRef.current.value, parseInt(this.timezoneRef.current.value)]
        );
        this.setState({ valid: valid });
    };

    componentDidMount() {
        this.setState({
            valid: this.timeRef.current.valueAsDate !== null,
        });
    }

    render() {
        return (
            <div className="control is-expanded">
                <div className="field has-addons">
                    <TimeControl value={this.props.temp[0]} inputRef={this.timeRef} handleChange={this.handleChange} invalid={!this.state.valid} />
                    <NanosecondsControl value={this.props.temp[1]} handleChange={this.handleChange} inputRef={this.nanosecondsRef} invalid={!this.state.valid} />
                    <TimezoneControl value={this.props.temp[2]} handleChange={this.handleChange} selectRef={this.timezoneRef} invalid={!this.state.valid} />
                    {this.state.valid && (
                        <div className="control">
                            <ClipboardContext.Consumer>{copy => <Button icon="fa-regular fa-copy" onClick={copy} value={(this.props.value as _Time).toString()} />}</ClipboardContext.Consumer>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

class PropertyDateTimeInput extends APropertyInput {
    state = {
        valid: true,
    };

    timezoneRef = React.createRef<HTMLSelectElement>();
    nanosecondsRef = React.createRef<HTMLInputElement>();
    timeRef = React.createRef<HTMLInputElement>();
    dateRef = React.createRef<HTMLInputElement>();

    handleChange = () => {
        const valid = this.dateRef.current.valueAsDate !== null && this.timeRef.current.valueAsDate !== null;
        this.props.onValueChange(
            this.props.name,
            valid
                ? new _DateTime(
                      this.dateRef.current.valueAsDate.getUTCFullYear(),
                      this.dateRef.current.valueAsDate.getUTCMonth() + 1,
                      this.dateRef.current.valueAsDate.getUTCDate(),
                      this.timeRef.current.valueAsDate.getUTCHours(),
                      this.timeRef.current.valueAsDate.getUTCMinutes(),
                      this.timeRef.current.valueAsDate.getUTCSeconds(),
                      this.nanosecondsRef.current.valueAsNumber,
                      parseInt(this.timezoneRef.current.value) * 60 * 60
                  )
                : null,
            [this.dateRef.current.value, this.timeRef.current.value, this.nanosecondsRef.current.value, parseInt(this.timezoneRef.current.value)]
        );
        this.setState({ valid: valid });
    };

    componentDidMount() {
        this.setState({
            valid: this.dateRef.current.valueAsDate !== null && this.timeRef.current.valueAsDate !== null,
        });
    }

    render() {
        return (
            <div className="control is-expanded">
                <div className="field has-addons">
                    <DateControl value={this.props.temp[0]} handleChange={this.handleChange} inputRef={this.dateRef} invalid={!this.state.valid} />
                    <TimeControl value={this.props.temp[1]} inputRef={this.timeRef} handleChange={this.handleChange} invalid={!this.state.valid} />
                    <NanosecondsControl value={this.props.temp[2]} handleChange={this.handleChange} inputRef={this.nanosecondsRef} invalid={!this.state.valid} />
                    <TimezoneControl value={this.props.temp[3]} handleChange={this.handleChange} selectRef={this.timezoneRef} invalid={!this.state.valid} />
                    {this.state.valid && (
                        <div className="control">
                            <ClipboardContext.Consumer>{copy => <Button icon="fa-regular fa-copy" onClick={copy} value={(this.props.value as _DateTime).toString()} />}</ClipboardContext.Consumer>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

class PropertyLocalTimeInput extends APropertyInput {
    state = {
        valid: true,
    };

    nanosecondsRef = React.createRef<HTMLInputElement>();
    timeRef = React.createRef<HTMLInputElement>();

    handleChange = () => {
        const valid = this.timeRef.current.valueAsDate !== null;
        this.props.onValueChange(
            this.props.name,
            valid
                ? new _LocalTime(
                      this.timeRef.current.valueAsDate.getUTCHours(),
                      this.timeRef.current.valueAsDate.getUTCMinutes(),
                      this.timeRef.current.valueAsDate.getUTCSeconds(),
                      this.nanosecondsRef.current.valueAsNumber
                  )
                : null,
            [this.timeRef.current.value, this.nanosecondsRef.current.value]
        );
        this.setState({ valid: valid });
    };

    componentDidMount() {
        this.setState({ valid: this.timeRef.current.valueAsDate !== null });
    }

    render() {
        return (
            <div className="control is-expanded">
                <div className="field has-addons">
                    <TimeControl value={this.props.temp[0]} inputRef={this.timeRef} handleChange={this.handleChange} invalid={!this.state.valid} />
                    <NanosecondsControl value={this.props.temp[1]} handleChange={this.handleChange} inputRef={this.nanosecondsRef} invalid={!this.state.valid} />
                    {this.state.valid && (
                        <div className="control">
                            <ClipboardContext.Consumer>{copy => <Button icon="fa-regular fa-copy" onClick={copy} value={(this.props.value as _LocalTime).toString()} />}</ClipboardContext.Consumer>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

class PropertyLocalDateTimeInput extends APropertyInput {
    state = {
        valid: true,
    };

    nanosecondsRef = React.createRef<HTMLInputElement>();
    timeRef = React.createRef<HTMLInputElement>();
    dateRef = React.createRef<HTMLInputElement>();

    handleChange = () => {
        const valid = this.dateRef.current.valueAsDate !== null && this.timeRef.current.valueAsDate !== null;
        this.props.onValueChange(
            this.props.name,
            valid
                ? new _LocalDateTime(
                      this.dateRef.current.valueAsDate.getUTCFullYear(),
                      this.dateRef.current.valueAsDate.getUTCMonth() + 1,
                      this.dateRef.current.valueAsDate.getUTCDate(),
                      this.timeRef.current.valueAsDate.getUTCHours(),
                      this.timeRef.current.valueAsDate.getUTCMinutes(),
                      this.timeRef.current.valueAsDate.getUTCSeconds(),
                      this.nanosecondsRef.current.valueAsNumber
                  )
                : null,
            [this.dateRef.current.value, this.timeRef.current.value, this.nanosecondsRef.current.value]
        );
        this.setState({ valid: valid });
    };

    componentDidMount() {
        this.setState({ valid: this.dateRef.current.valueAsDate !== null && this.timeRef.current.valueAsDate !== null });
    }

    render() {
        return (
            <div className="control is-expanded">
                <div className="field has-addons">
                    <DateControl value={this.props.temp[0]} handleChange={this.handleChange} inputRef={this.dateRef} invalid={!this.state.valid} />
                    <TimeControl value={this.props.temp[1]} inputRef={this.timeRef} handleChange={this.handleChange} invalid={!this.state.valid} />
                    <NanosecondsControl value={this.props.temp[2]} handleChange={this.handleChange} inputRef={this.nanosecondsRef} invalid={!this.state.valid} />
                    {this.state.valid && (
                        <div className="control">
                            <ClipboardContext.Consumer>{copy => <Button icon="fa-regular fa-copy" onClick={copy} value={(this.props.value as _LocalDateTime).toString()} />}</ClipboardContext.Consumer>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

class PropertyDurationInput extends APropertyInput {
    render() {
        return (
            <div className="control is-expanded has-icons-right">
                <input
                    className="input"
                    type="text"
                    value={this.props.temp}
                    name={this.props.name}
                    autoFocus={this.props.focus}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => this.props.onValueChange(this.props.name, stringToDuration(e.currentTarget.value), e.currentTarget.value)}
                    pattern="P(\d+Y)?(\d+M)?(\d+D)?(T(\d+H)?(\d+M)?([\d\.]+S)?)?"
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

class PropertyPointInput extends APropertyInput {
    sridRef = React.createRef<HTMLSelectElement>();
    xRef = React.createRef<HTMLInputElement>();
    yRef = React.createRef<HTMLInputElement>();
    zRef = React.createRef<HTMLInputElement>();

    availableSRID = [
        ["4326", "wgs-84"],
        ["4979", "wgs-84-3d"],
        ["7203", "cartesian"],
        ["9157", "cartesian-3d"],
    ];

    handleChange = () => {
        const hasZ = ["4979", "9157"].includes(this.sridRef.current.value);
        this.props.onValueChange(
            this.props.name,
            hasZ
                ? new _Point(db.toInt(this.sridRef.current.value), this.xRef.current.valueAsNumber, this.yRef.current.valueAsNumber, this.zRef.current.valueAsNumber)
                : new _Point(db.toInt(this.sridRef.current.value), this.xRef.current.valueAsNumber, this.yRef.current.valueAsNumber),
            hasZ
                ? [this.sridRef.current.value, this.xRef.current.value, this.yRef.current.value, this.zRef.current.value]
                : [this.sridRef.current.value, this.xRef.current.value, this.yRef.current.value]
        );
    };

    render() {
        return (
            <div className="control is-expanded">
                <div className="field has-addons">
                    <div className="control has-icons-left">
                        <div className="select">
                            <select ref={this.sridRef} value={this.props.temp[0]} onChange={this.handleChange} title="SRID">
                                {this.availableSRID.map(type => (
                                    <option key={type[1]} value={type[0]}>
                                        {type[1]} ({type[0]})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <span className="icon is-left">
                            <i className="fa-solid fa-location-dot" />
                        </span>
                    </div>
                    <div className="control is-expanded has-icons-left">
                        <input type="number" title="X" ref={this.xRef} className="input" value={this.props.temp[1]} onChange={this.handleChange} step="any" />
                        <span className="icon is-left">
                            <i className="fa-solid fa-x" />
                        </span>
                    </div>
                    <div className="control is-expanded has-icons-left">
                        <input type="number" title="Y" ref={this.yRef} className="input" value={this.props.temp[2]} onChange={this.handleChange} step="any" />
                        <span className="icon is-left">
                            <i className="fa-solid fa-y" />
                        </span>
                    </div>
                    <div className={"control is-expanded has-icons-left " + (this.props.temp.length === 4 ? "" : "is-hidden")}>
                        <input type="number" title="Z" ref={this.zRef} className="input" value={this.props.temp[3] || 0} onChange={this.handleChange} step="any" />
                        <span className="icon is-left">
                            <i className="fa-solid fa-z" />
                        </span>
                    </div>
                    <div className="control">
                        <ClipboardContext.Consumer>{copy => <Button icon="fa-regular fa-copy" onClick={copy} value={(this.props.value as _Point).toString()} />}</ClipboardContext.Consumer>
                    </div>
                </div>
            </div>
        );
    }
}

export default PropertiesForm;
