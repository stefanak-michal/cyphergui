import { useState, useEffect, createRef, useContext } from 'react';
import { t_FormProperty, t_FormValue } from '../utils/types';
import { Ecosystem, EPropertyType } from '../utils/enums';
import db from '../db';
import { Button, Textarea } from './form';
import { ClipboardContext } from '../utils/contexts';
import {
    Date as _Date,
    DateTime as _DateTime,
    Duration as _Duration,
    LocalDateTime as _LocalDateTime,
    LocalTime as _LocalTime,
    Point as _Point,
    Time as _Time,
} from 'neo4j-driver-lite';
import { getPropertyAsTemp, stringToDuration } from '../utils/fn';

interface IPropertiesFormProps {
    properties: t_FormProperty[];
    updateProperties: (properties: t_FormProperty[]) => void;
}

const PropertiesForm: React.FC<IPropertiesFormProps> = ({ properties, updateProperties }) => {
    const [focus, setFocus] = useState<string>('');

    const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const target = e.currentTarget;
        const props = [...properties];
        const i = props.findIndex(p => target.name.startsWith('key.' + p.name));
        if (i > -1) {
            const parts = target.name.split('.');
            if (parts.length === 3) {
                (props[i].value[parseInt(parts[2])] as t_FormValue).key = target.value;
            } else {
                props[i].key = target.value;
            }

            updateProperties(props);
            setFocus(target.name);
        }
    };

    const handleValueChange = (name: string, value: any, temp: any = null) => {
        const props = [...properties];
        let i = props.findIndex(p => p.name === name);
        if (i > -1) {
            props[i].temp = temp;
            props[i].value = value;
        } else {
            i = props.findIndex(p => name.startsWith(p.name));
            if (i > -1) {
                const index = parseInt(name.split('.', 2)[1]);
                (props[i].value as t_FormValue[])[index].value = value;
                (props[i].value as t_FormValue[])[index].temp = temp;
            }
        }

        if (i > -1) {
            updateProperties(props);
            setFocus(name);
        }
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const target = e.currentTarget;
        const value = getDefaultValue(EPropertyType[target.value]);
        const temp = getPropertyAsTemp(EPropertyType[target.value], value);
        const props = [...properties];
        let i = props.findIndex(p => 'type.' + p.name === target.name);
        if (i > -1) {
            if (Array.isArray(value))
                value.push({
                    type: EPropertyType.String,
                    value: '',
                } as t_FormValue);
            props[i].type = EPropertyType[target.value];
            props[i].value = value;
            props[i].temp = temp;
        } else {
            i = props.findIndex(p => target.name.startsWith('subtype.' + p.name));
            if (i > -1) {
                const arr: string[] = target.name.split('.');
                if (arr.length === 2) {
                    //List
                    (props[i].value as t_FormValue[]).forEach((entry: t_FormValue) => {
                        entry.type = EPropertyType[target.value];
                        entry.value = value;
                        entry.temp = temp;
                    });
                } else if (arr.length === 3) {
                    //Map
                    (props[i].value as t_FormValue[])[parseInt(arr[2])].type = EPropertyType[target.value];
                    (props[i].value as t_FormValue[])[parseInt(arr[2])].value = value;
                    (props[i].value as t_FormValue[])[parseInt(arr[2])].temp = temp;
                }
            }
        }

        if (i > -1) {
            updateProperties(props);
            setFocus(target.name);
        }
    };

    const getDefaultValue = (type: EPropertyType): any => {
        const int0 = db.toInt(0);
        switch (type) {
            case EPropertyType.String:
                return '';
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

    const handleDelete = (name: string) => {
        const props = [...properties];
        let i = props.findIndex(p => p.name === name);
        if (i > -1) {
            props.splice(i, 1);
        } else {
            i = props.findIndex(p => name.startsWith(p.name));
            if (i > -1) {
                const index = parseInt(name.split('.', 2)[1]);
                (props[i].value as t_FormValue[]).splice(index, 1);
            }
        }

        if (i > -1) updateProperties(props);
    };

    const handleAdd = (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault();
        const target = e.currentTarget;
        const props = [...properties];
        if (target.value) {
            const i = props.findIndex(p => p.name === target.value);
            if (i > -1) {
                const valueType = (props[i].value as t_FormValue[])[props[i].value.length - 1].type;
                const value = getDefaultValue(valueType);
                (props[i].value as t_FormValue[]).push({
                    type: valueType,
                    value: value,
                    temp: getPropertyAsTemp(valueType, value),
                } as t_FormValue);
                updateProperties(props);
                setFocus(props[i].name + '.' + (props[i].value.length - 1));
            }
        } else {
            const i = new Date().getTime().toString();
            props.push({
                name: i,
                key: '',
                value: '',
                type: EPropertyType.String,
            });

            updateProperties(props);
            setFocus('key.' + i);
        }
    };

    return (
        <>
            {properties.map(p => (
                <Property
                    key={p.name}
                    focus={focus}
                    property={p}
                    onKeyChange={handleKeyChange}
                    onValueChange={handleValueChange}
                    onTypeChange={handleTypeChange}
                    onDelete={handleDelete}
                    onAdd={handleAdd}
                />
            ))}

            <Button icon='fa-solid fa-plus' color='ml-1' text='Add property' onClick={handleAdd} />
        </>
    );
};

const Property: React.FC<{
    property: t_FormProperty;
    focus: string;
    onKeyChange: (e: React.ChangeEvent) => void;
    onValueChange: (name: string, value: any, temp?: any) => void;
    onTypeChange: (e: React.ChangeEvent) => void;
    onDelete: (name: string) => void;
    onAdd: (e: React.PointerEvent) => void;
}> = ({ property, focus, onKeyChange, onValueChange, onTypeChange, onDelete, onAdd }) => {
    const copy = useContext(ClipboardContext);
    const components = {
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

    const deleteButton = (
        <div className='control'>
            <Button icon='fa-regular fa-trash-can' onClick={() => onDelete(property.name)} title='Delete property' />
        </div>
    );

    const nameInput = (
        <div className='control'>
            <input
                name={'key.' + property.name}
                autoFocus={focus === 'key.' + property.name}
                className='input'
                type='text'
                value={property.key}
                onChange={onKeyChange}
                placeholder='Key'
                pattern='^[A-Za-z][A-Za-z_0-9]*$'
                required
            />
        </div>
    );

    if (property.type === EPropertyType.List) {
        return (
            <div className='field is-grouped is-hoverable p-1 mb-1'>
                {nameInput}

                <div className='control is-expanded'>
                    <div className='field is-grouped'>
                        <div className='control'>
                            <PropertyType
                                name={property.name}
                                selected={property.type}
                                onTypeChange={onTypeChange}
                                subtype={false}
                            />
                        </div>
                        <div className='control'>
                            <PropertyType
                                name={property.name}
                                selected={(property.value as t_FormValue[])[0]?.type ?? EPropertyType.String}
                                onTypeChange={onTypeChange}
                                subtype={true}
                            />
                        </div>
                        <div className='control'>
                            <Button
                                icon='fa-regular fa-copy'
                                onClick={copy}
                                value={JSON.stringify(
                                    (property.value as t_FormValue[]).map(v =>
                                        db.isInt(v.value) ? db.fromInt(v.value) : v.value
                                    )
                                )}
                            />
                        </div>
                    </div>

                    {(property.value as t_FormValue[]).map((v, i) => {
                        const PropertyInputComponent: React.FC<PropertyInputProps> =
                            components['Property' + v.type + 'Input'];
                        const hasFocus = focus === property.name + '.' + i;
                        return (
                            <div className='field is-grouped' key={i}>
                                <PropertyInputComponent
                                    name={property.name + '.' + i}
                                    value={v.value}
                                    temp={v.temp}
                                    onValueChange={onValueChange}
                                    focus={hasFocus}
                                />
                                <Button
                                    icon='fa-solid fa-circle-minus'
                                    onClick={() => onDelete(property.name + '.' + i)}
                                    title='Remove list entry'
                                />
                            </div>
                        );
                    })}
                    <div className='field'>
                        <div className='control'>
                            <Button
                                icon='fa-solid fa-circle-plus'
                                onClick={onAdd}
                                title='Add list entry'
                                value={property.name}
                            />
                        </div>
                    </div>
                </div>

                {deleteButton}
            </div>
        );
    }

    if (property.type === EPropertyType.Map) {
        return (
            <div className='field is-grouped is-hoverable p-1 mb-1'>
                {nameInput}

                <div className='control is-expanded'>
                    <div className='field is-grouped'>
                        <div className='control'>
                            <PropertyType
                                name={property.name}
                                selected={property.type}
                                onTypeChange={onTypeChange}
                                subtype={false}
                            />
                        </div>
                        <div className='control'>
                            <Button
                                icon='fa-regular fa-copy'
                                onClick={e => {
                                    const obj = {};
                                    (property.value as t_FormValue[]).forEach(v => {
                                        obj[v.key] = db.isInt(v.value) ? db.fromInt(v.value) : v.value;
                                    });
                                    e.currentTarget.value = JSON.stringify(obj);
                                    copy(e);
                                }}
                            />
                        </div>
                    </div>

                    {(property.value as t_FormValue[]).map((v, i) => {
                        const PropertyInputComponent: React.FC<PropertyInputProps> =
                            components['Property' + v.type + 'Input'];
                        const newFocus = focus === property.name + '.' + i;
                        return (
                            <div className='field is-grouped' key={i}>
                                <div className='control'>
                                    <input
                                        name={'key.' + property.name + '.' + i}
                                        autoFocus={focus === 'key.' + property.name + '.' + i}
                                        className='input'
                                        type='text'
                                        value={v.key}
                                        onChange={onKeyChange}
                                        placeholder='Key'
                                        pattern='^[A-Za-z][A-Za-z_0-9]*$'
                                        required
                                    />
                                </div>
                                <PropertyInputComponent
                                    name={property.name + '.' + i}
                                    value={v.value}
                                    temp={v.temp}
                                    onValueChange={onValueChange}
                                    focus={newFocus}
                                />
                                <div className='control'>
                                    <Button
                                        icon='fa-solid fa-circle-minus'
                                        onClick={() => onDelete(property.name + '.' + i)}
                                        title='Remove map entry'
                                    />
                                </div>
                                <PropertyType
                                    name={property.name + '.' + i}
                                    selected={v.type}
                                    onTypeChange={onTypeChange}
                                    subtype={true}
                                />
                            </div>
                        );
                    })}
                    <div className='field'>
                        <div className='control'>
                            <Button
                                icon='fa-solid fa-circle-plus'
                                onClick={onAdd}
                                title='Add map entry'
                                value={property.name}
                            />
                        </div>
                    </div>
                </div>

                {deleteButton}
            </div>
        );
    }

    const PropertyInputComponent: React.FC<PropertyInputProps> = components['Property' + property.type + 'Input'];
    return (
        <div className='field is-grouped is-hoverable p-1 mb-1'>
            {nameInput}
            <PropertyInputComponent
                name={property.name}
                value={property.value}
                temp={property.temp}
                onValueChange={onValueChange}
                focus={focus === property.name}
            />
            <div className='control'>
                <PropertyType
                    name={property.name}
                    selected={property.type}
                    onTypeChange={onTypeChange}
                    subtype={false}
                />
            </div>
            {deleteButton}
        </div>
    );
};

const PropertyType: React.FC<{
    name: string;
    selected: EPropertyType;
    onTypeChange: (e: React.ChangeEvent) => void;
    subtype: boolean;
}> = ({ name, selected, onTypeChange, subtype }) => {
    const getPropertyTypes = () => {
        return Object.keys(EPropertyType).filter(k => {
            if (subtype && (k === EPropertyType.List || k === EPropertyType.Map)) return false;
            if (
                db.ecosystem === Ecosystem.Memgraph &&
                (k === EPropertyType.Point || k === EPropertyType.Time || k === EPropertyType.DateTime)
            )
                return false;
            if (db.ecosystem === Ecosystem.Neo4j && k === EPropertyType.Map) return false;
            return true;
        });
    };

    return (
        <div className='select'>
            <select
                name={(subtype ? 'subtype.' : 'type.') + name}
                value={selected}
                onChange={onTypeChange}
                title={subtype ? 'Type of list/map entries' : 'Property type'}
            >
                {getPropertyTypes().map(type => (
                    <option key={type} value={type}>
                        {type}
                    </option>
                ))}
            </select>
        </div>
    );
};

interface PropertyInputProps {
    name: string;
    value: any;
    temp: any;
    onValueChange: (name: string, value: any, temp?: any) => void;
    focus: boolean;
}

const PropertyStringInput: React.FC<PropertyInputProps> = ({ name, value, onValueChange, focus }) => {
    const copy = useContext(ClipboardContext);
    return (
        <div className='control is-expanded has-icons-right'>
            <Textarea
                name={name}
                value={value}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onValueChange(name, e.currentTarget.value)}
                focus={focus}
                placeholder='Value'
            />
            <span className='icon is-right is-clickable' onClick={copy}>
                <i className='fa-regular fa-copy' />
            </span>
        </div>
    );
};

const PropertyBooleanInput: React.FC<PropertyInputProps> = ({ name, value, onValueChange, focus }) => {
    return (
        <div className='control is-expanded'>
            <label className='switch'>
                <input
                    name={name}
                    type='checkbox'
                    checked={value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onValueChange(name, e.currentTarget.checked)}
                    placeholder='Value'
                    autoFocus={focus}
                />
                <span className='slider' />
            </label>
        </div>
    );
};

const PropertyIntegerInput: React.FC<PropertyInputProps> = ({ name, temp, onValueChange, focus }) => {
    const copy = useContext(ClipboardContext);
    return (
        <div className='control is-expanded has-icons-right'>
            <input
                name={name}
                className='input'
                type='number'
                value={temp}
                step='1'
                autoFocus={focus}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onValueChange(
                        name,
                        e.currentTarget.value.length ? db.toInt(e.currentTarget.value) : null,
                        e.currentTarget.value
                    )
                }
                placeholder='Value'
            />
            <span className='icon is-right is-clickable' onClick={copy}>
                <i className='fa-regular fa-copy' />
            </span>
        </div>
    );
};

const PropertyFloatInput: React.FC<PropertyInputProps> = ({ name, temp, onValueChange, focus }) => {
    const copy = useContext(ClipboardContext);
    return (
        <div className='control is-expanded has-icons-right'>
            <input
                name={name}
                className='input'
                type='number'
                value={temp}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onValueChange(name, e.currentTarget.valueAsNumber || null, e.currentTarget.value)
                }
                autoFocus={focus}
                placeholder='Value'
                step='any'
            />
            <span className='icon is-right is-clickable' onClick={copy}>
                <i className='fa-regular fa-copy' />
            </span>
        </div>
    );
};

/*
 * Temporal types - part controls
 */

const TimeControl: React.FC<{
    value: string;
    handleChange: () => void;
    inputRef: React.RefObject<HTMLInputElement>;
    invalid?: boolean;
}> = ({ value, handleChange, inputRef, invalid }) => {
    return (
        <div className='control is-expanded'>
            <input
                className={'input ' + (invalid ? 'is-danger' : '')}
                type='time'
                value={value}
                onChange={handleChange}
                step='1'
                ref={inputRef}
                title='Time'
            />
        </div>
    );
};

const NanosecondsControl: React.FC<{
    value: string;
    handleChange: () => void;
    inputRef: React.RefObject<HTMLInputElement>;
    invalid?: boolean;
}> = ({ value, handleChange, inputRef, invalid }) => {
    return (
        <div className='control'>
            <input
                className={'input ' + (invalid ? 'is-danger' : '')}
                type='number'
                step='1'
                min='0'
                max='999999999'
                value={value}
                title='Nanoseconds'
                ref={inputRef}
                onChange={handleChange}
            />
        </div>
    );
};

const DateControl: React.FC<{
    value: string;
    handleChange: () => void;
    inputRef: React.RefObject<HTMLInputElement>;
    invalid?: boolean;
}> = ({ value, handleChange, inputRef, invalid }) => {
    return (
        <div className='control is-expanded'>
            <input
                className={'input ' + (invalid ? 'is-danger' : '')}
                type='date'
                value={value}
                onChange={handleChange}
                step='1'
                ref={inputRef}
                title='Date'
            />
        </div>
    );
};

const TimezoneControl: React.FC<{
    value: number;
    handleChange: () => void;
    selectRef: React.RefObject<HTMLSelectElement>;
    invalid?: boolean;
}> = ({ value, handleChange, selectRef, invalid }) => {
    const range = [];
    for (let i = -11; i <= 12; i++) range.push(i);

    return (
        <div className='control'>
            <div className={'select ' + (invalid ? 'is-danger' : '')}>
                <select title='Timezone' ref={selectRef} value={value} onChange={handleChange}>
                    {range.map((offset, i) => (
                        <option key={i} value={offset}>
                            {(offset >= 0 ? '+' : '-') + Math.abs(offset).toString().padStart(2, '0') + ':00'}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

/*
 * Temporal types
 */

const PropertyDateInput: React.FC<PropertyInputProps> = ({ name, temp, onValueChange }) => {
    const [valid, setValid] = useState(true);
    const dateRef = createRef<HTMLInputElement>();
    const copy = useContext(ClipboardContext);

    const handleChange = () => {
        const valid = dateRef.current.valueAsDate !== null;
        onValueChange(
            name,
            valid
                ? new _Date(
                      dateRef.current.valueAsDate.getUTCFullYear(),
                      dateRef.current.valueAsDate.getUTCMonth() + 1,
                      dateRef.current.valueAsDate.getUTCDate()
                  )
                : null,
            dateRef.current.value
        );
        setValid(valid);
    };

    useEffect(() => {
        setValid(dateRef.current.valueAsDate !== null);
    }, []);

    return (
        <div className='control is-expanded'>
            <div className='field has-addons'>
                <DateControl value={temp} handleChange={handleChange} inputRef={dateRef} invalid={!valid} />
                {valid && (
                    <div className='control'>
                        <Button icon='fa-regular fa-copy' onClick={copy} value={temp} />
                    </div>
                )}
            </div>
        </div>
    );
};

const PropertyTimeInput: React.FC<PropertyInputProps> = ({ name, value, temp, onValueChange }) => {
    const [valid, setValid] = useState(true);
    const timezoneRef = createRef<HTMLSelectElement>();
    const nanosecondsRef = createRef<HTMLInputElement>();
    const timeRef = createRef<HTMLInputElement>();
    const copy = useContext(ClipboardContext);

    const handleChange = () => {
        const valid = timeRef.current.valueAsDate !== null;
        onValueChange(
            name,
            valid
                ? new _Time(
                      timeRef.current.valueAsDate.getUTCHours(),
                      timeRef.current.valueAsDate.getUTCMinutes(),
                      timeRef.current.valueAsDate.getUTCSeconds(),
                      nanosecondsRef.current.valueAsNumber,
                      parseInt(timezoneRef.current.value) * 60 * 60
                  )
                : null,
            [timeRef.current.value, nanosecondsRef.current.value, parseInt(timezoneRef.current.value)]
        );
        setValid(valid);
    };

    useEffect(() => {
        setValid(timeRef.current.valueAsDate !== null);
    }, []);

    return (
        <div className='control is-expanded'>
            <div className='field has-addons'>
                <TimeControl value={temp[0]} inputRef={timeRef} handleChange={handleChange} invalid={!valid} />
                <NanosecondsControl
                    value={temp[1]}
                    handleChange={handleChange}
                    inputRef={nanosecondsRef}
                    invalid={!valid}
                />
                <TimezoneControl value={temp[2]} handleChange={handleChange} selectRef={timezoneRef} invalid={!valid} />
                {valid && (
                    <div className='control'>
                        <Button icon='fa-regular fa-copy' onClick={copy} value={(value as _Time).toString()} />
                    </div>
                )}
            </div>
        </div>
    );
};

const PropertyDateTimeInput: React.FC<PropertyInputProps> = ({ name, value, temp, onValueChange }) => {
    const [valid, setValid] = useState(true);
    const timezoneRef = createRef<HTMLSelectElement>();
    const nanosecondsRef = createRef<HTMLInputElement>();
    const timeRef = createRef<HTMLInputElement>();
    const dateRef = createRef<HTMLInputElement>();
    const copy = useContext(ClipboardContext);

    const handleChange = () => {
        const valid = dateRef.current.valueAsDate !== null && timeRef.current.valueAsDate !== null;
        onValueChange(
            name,
            valid
                ? new _DateTime(
                      dateRef.current.valueAsDate.getUTCFullYear(),
                      dateRef.current.valueAsDate.getUTCMonth() + 1,
                      dateRef.current.valueAsDate.getUTCDate(),
                      timeRef.current.valueAsDate.getUTCHours(),
                      timeRef.current.valueAsDate.getUTCMinutes(),
                      timeRef.current.valueAsDate.getUTCSeconds(),
                      nanosecondsRef.current.valueAsNumber,
                      parseInt(timezoneRef.current.value) * 60 * 60
                  )
                : null,
            [
                dateRef.current.value,
                timeRef.current.value,
                nanosecondsRef.current.value,
                parseInt(timezoneRef.current.value),
            ]
        );
        setValid(valid);
    };

    useEffect(() => {
        setValid(dateRef.current.valueAsDate !== null && timeRef.current.valueAsDate !== null);
    }, []);

    return (
        <div className='control is-expanded'>
            <div className='field has-addons'>
                <DateControl value={temp[0]} handleChange={handleChange} inputRef={dateRef} invalid={!valid} />
                <TimeControl value={temp[1]} inputRef={timeRef} handleChange={handleChange} invalid={!valid} />
                <NanosecondsControl
                    value={temp[2]}
                    handleChange={handleChange}
                    inputRef={nanosecondsRef}
                    invalid={!valid}
                />
                <TimezoneControl value={temp[3]} handleChange={handleChange} selectRef={timezoneRef} invalid={!valid} />
                {valid && (
                    <div className='control'>
                        <Button icon='fa-regular fa-copy' onClick={copy} value={(value as _DateTime).toString()} />
                    </div>
                )}
            </div>
        </div>
    );
};

const PropertyLocalTimeInput: React.FC<PropertyInputProps> = ({ name, value, temp, onValueChange }) => {
    const [valid, setValid] = useState(true);
    const nanosecondsRef = createRef<HTMLInputElement>();
    const timeRef = createRef<HTMLInputElement>();
    const copy = useContext(ClipboardContext);

    const handleChange = () => {
        const valid = timeRef.current.valueAsDate !== null;
        onValueChange(
            name,
            valid
                ? new _LocalTime(
                      timeRef.current.valueAsDate.getUTCHours(),
                      timeRef.current.valueAsDate.getUTCMinutes(),
                      timeRef.current.valueAsDate.getUTCSeconds(),
                      nanosecondsRef.current.valueAsNumber
                  )
                : null,
            [timeRef.current.value, nanosecondsRef.current.value]
        );
        setValid(valid);
    };

    useEffect(() => {
        setValid(timeRef.current.valueAsDate !== null);
    }, []);

    return (
        <div className='control is-expanded'>
            <div className='field has-addons'>
                <TimeControl value={temp[0]} inputRef={timeRef} handleChange={handleChange} invalid={!valid} />
                <NanosecondsControl
                    value={temp[1]}
                    handleChange={handleChange}
                    inputRef={nanosecondsRef}
                    invalid={!valid}
                />
                {valid && (
                    <div className='control'>
                        <Button icon='fa-regular fa-copy' onClick={copy} value={(value as _LocalTime).toString()} />
                    </div>
                )}
            </div>
        </div>
    );
};

const PropertyLocalDateTimeInput: React.FC<PropertyInputProps> = ({ name, value, temp, onValueChange }) => {
    const [valid, setValid] = useState(true);
    const nanosecondsRef = createRef<HTMLInputElement>();
    const timeRef = createRef<HTMLInputElement>();
    const dateRef = createRef<HTMLInputElement>();
    const copy = useContext(ClipboardContext);

    const handleChange = () => {
        const valid = dateRef.current.valueAsDate !== null && timeRef.current.valueAsDate !== null;
        onValueChange(
            name,
            valid
                ? new _LocalDateTime(
                      dateRef.current.valueAsDate.getUTCFullYear(),
                      dateRef.current.valueAsDate.getUTCMonth() + 1,
                      dateRef.current.valueAsDate.getUTCDate(),
                      timeRef.current.valueAsDate.getUTCHours(),
                      timeRef.current.valueAsDate.getUTCMinutes(),
                      timeRef.current.valueAsDate.getUTCSeconds(),
                      nanosecondsRef.current.valueAsNumber
                  )
                : null,
            [dateRef.current.value, timeRef.current.value, nanosecondsRef.current.value]
        );
        setValid(valid);
    };

    useEffect(() => {
        setValid(dateRef.current.valueAsDate !== null && timeRef.current.valueAsDate !== null);
    }, []);

    return (
        <div className='control is-expanded'>
            <div className='field has-addons'>
                <DateControl value={temp[0]} handleChange={handleChange} inputRef={dateRef} invalid={!valid} />
                <TimeControl value={temp[1]} inputRef={timeRef} handleChange={handleChange} invalid={!valid} />
                <NanosecondsControl
                    value={temp[2]}
                    handleChange={handleChange}
                    inputRef={nanosecondsRef}
                    invalid={!valid}
                />
                {valid && (
                    <div className='control'>
                        <Button icon='fa-regular fa-copy' onClick={copy} value={(value as _LocalDateTime).toString()} />
                    </div>
                )}
            </div>
        </div>
    );
};

const PropertyDurationInput: React.FC<PropertyInputProps> = ({ name, temp, onValueChange, focus }) => {
    const copy = useContext(ClipboardContext);
    return (
        <div className='control is-expanded has-icons-right'>
            <input
                className='input'
                type='text'
                value={temp}
                name={name}
                autoFocus={focus}
                title='Duration'
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onValueChange(name, stringToDuration(e.currentTarget.value), e.currentTarget.value)
                }
                pattern='P(\d+Y)?(\d+M)?(\d+D)?(T(\d+H)?(\d+M)?([\d\.]+S)?)?'
            />
            <span className='icon is-right is-clickable' onClick={copy}>
                <i className='fa-regular fa-copy' />
            </span>
        </div>
    );
};

const PropertyPointInput: React.FC<PropertyInputProps> = ({ name, value, temp, onValueChange }) => {
    const sridRef = createRef<HTMLSelectElement>();
    const xRef = createRef<HTMLInputElement>();
    const yRef = createRef<HTMLInputElement>();
    const zRef = createRef<HTMLInputElement>();
    const copy = useContext(ClipboardContext);

    const availableSRID = [
        ['4326', 'wgs-84'],
        ['4979', 'wgs-84-3d'],
        ['7203', 'cartesian'],
        ['9157', 'cartesian-3d'],
    ];

    const handleChange = () => {
        const hasZ = ['4979', '9157'].includes(sridRef.current.value);
        onValueChange(
            name,
            hasZ
                ? new _Point(
                      db.toInt(sridRef.current.value),
                      xRef.current.valueAsNumber,
                      yRef.current.valueAsNumber,
                      zRef.current.valueAsNumber
                  )
                : new _Point(db.toInt(sridRef.current.value), xRef.current.valueAsNumber, yRef.current.valueAsNumber),
            hasZ
                ? [sridRef.current.value, xRef.current.value, yRef.current.value, zRef.current.value]
                : [sridRef.current.value, xRef.current.value, yRef.current.value]
        );
    };

    return (
        <div className='control is-expanded'>
            <div className='field has-addons'>
                <div className='control has-icons-left'>
                    <div className='select'>
                        <select ref={sridRef} value={temp[0]} onChange={handleChange} title='SRID'>
                            {availableSRID.map(type => (
                                <option key={type[1]} value={type[0]}>
                                    {type[1]} ({type[0]})
                                </option>
                            ))}
                        </select>
                    </div>
                    <span className='icon is-left'>
                        <i className='fa-solid fa-location-dot' />
                    </span>
                </div>
                <div className='control is-expanded has-icons-left'>
                    <input
                        type='number'
                        title='X'
                        ref={xRef}
                        className='input'
                        value={temp[1]}
                        onChange={handleChange}
                        step='any'
                    />
                    <span className='icon is-left'>
                        <i className='fa-solid fa-x' />
                    </span>
                </div>
                <div className='control is-expanded has-icons-left'>
                    <input
                        type='number'
                        title='Y'
                        ref={yRef}
                        className='input'
                        value={temp[2]}
                        onChange={handleChange}
                        step='any'
                    />
                    <span className='icon is-left'>
                        <i className='fa-solid fa-y' />
                    </span>
                </div>
                <div className={'control is-expanded has-icons-left ' + (temp.length === 4 ? '' : 'is-hidden')}>
                    <input
                        type='number'
                        title='Z'
                        ref={zRef}
                        className='input'
                        value={temp[3] || 0}
                        onChange={handleChange}
                        step='any'
                    />
                    <span className='icon is-left'>
                        <i className='fa-solid fa-z' />
                    </span>
                </div>
                <div className='control'>
                    <Button icon='fa-regular fa-copy' onClick={copy} value={(value as _Point).toString()} />
                </div>
            </div>
        </div>
    );
};

export default PropertiesForm;
