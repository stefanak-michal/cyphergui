import {
    Node as _Node,
    Relationship as _Relationship,
} from 'neo4j-driver-lite';
import * as React from 'react';
import { IStyle } from '../Graph';
import { printProperty } from '../../../utils/fn';
import { ClipboardContext } from '../../../utils/contexts';
import { Button } from '../../../components/form';
import { IStashManager, ITabManager } from '../../../utils/interfaces';
import db from '../../../db';
import { EPage } from '../../../utils/enums';

interface ISidebarProps {
    detail: _Node | _Relationship | null;
    labels: { [key: string]: number };
    types: { [key: string]: number };
    labelClick: (label: string) => void;
    typeClick: (type: string) => void;
    nodeStyles: IStyle;
    edgeStyles: IStyle;
    tabManager: ITabManager;
    stashManager: IStashManager;
    database: string;
}

class SidebarContent extends React.Component<ISidebarProps, {}> {
    isColorDark = (color: string): boolean => {
        color = color.replace('#', '');
        const rgb = parseInt(color, 16); // convert rrggbb to decimal
        const r = (rgb >> 16) & 0xff; // extract red
        const g = (rgb >> 8) & 0xff; // extract green
        const b = (rgb >> 0) & 0xff; // extract blue
        return 0.2126 * r + 0.7152 * g + 0.0722 * b < 175; // per ITU-R BT.709
    };

    labelButton = (
        label: string,
        modal: boolean = true
    ): React.ReactElement => {
        return (
            <button
                className={
                    'button tag is-rounded px-2 is-medium ' +
                    (this.isColorDark(this.props.nodeStyles[label].color)
                        ? 'has-text-white'
                        : 'has-text-black')
                }
                key={label}
                style={{ backgroundColor: this.props.nodeStyles[label].color }}
                onClick={() =>
                    modal
                        ? this.props.labelClick(label)
                        : this.props.tabManager.add(
                              label,
                              'fa-regular fa-circle',
                              EPage.Label,
                              { label: label, database: this.props.database }
                          )
                }
            >
                :{label} {modal ? '(' + this.props.labels[label] + ')' : ''}
            </button>
        );
    };

    typeButton = (type: string, modal: boolean = true): React.ReactElement => {
        return (
            <button
                className={
                    'button tag is-rounded px-2 is-medium ' +
                    (this.isColorDark(this.props.edgeStyles[type].color)
                        ? 'has-text-white'
                        : '')
                }
                key={type}
                style={{ backgroundColor: this.props.edgeStyles[type].color }}
                onClick={() =>
                    modal
                        ? this.props.typeClick(type)
                        : this.props.tabManager.add(
                              type,
                              'fa-solid fa-arrow-right-long',
                              EPage.Type,
                              { type: type, database: this.props.database }
                          )
                }
            >
                :{type} {modal ? '(' + this.props.types[type] + ')' : ''}
            </button>
        );
    };

    render() {
        if (this.props.detail === null) {
            return (
                <>
                    {Object.keys(this.props.labels).length > 0 && (
                        <>
                            <p className='subtitle is-5 mb-1'>Node Labels</p>
                            <span className='buttons'>
                                {Object.keys(this.props.labels).map(label =>
                                    this.labelButton(label)
                                )}
                            </span>
                        </>
                    )}

                    {Object.keys(this.props.types).length > 0 && (
                        <>
                            <p className='subtitle is-5 mb-1'>
                                Relationship Types
                            </p>
                            <span className='buttons'>
                                {Object.keys(this.props.types).map(type =>
                                    this.typeButton(type)
                                )}
                            </span>
                        </>
                    )}
                </>
            );
        }

        if (this.props.detail instanceof _Node) {
            return (
                <ClipboardContext.Consumer>
                    {copy => (
                        <>
                            <div className='buttons mb-3'>
                                <Button
                                    onClick={() =>
                                        this.props.tabManager.add(
                                            {
                                                prefix: 'Node',
                                                i: this.props.detail.identity,
                                            },
                                            'fa-solid fa-pen-to-square',
                                            EPage.Node,
                                            {
                                                id: db.getId(this.props.detail),
                                                database: this.props.database,
                                            }
                                        )
                                    }
                                    icon='fa-solid fa-pen-clip'
                                    text={
                                        '#' +
                                        db.strInt(this.props.detail.identity)
                                    }
                                />
                                {this.props.stashManager.button(
                                    this.props.detail,
                                    this.props.database
                                )}
                            </div>

                            <div className='buttons mb-0'>
                                {(this.props.detail as _Node).labels.map(
                                    label => this.labelButton(label, false)
                                )}
                            </div>

                            {db.hasElementId && (
                                <>
                                    <p className='subtitle is-5 mt-3 mb-1'>
                                        ElementId
                                    </p>
                                    <span
                                        className='is-copyable'
                                        onClick={copy}
                                    >
                                        {this.props.detail.elementId}
                                    </span>
                                </>
                            )}

                            <p className='subtitle is-5 mt-3 mb-1'>
                                Properties
                            </p>
                            <table className='table is-bordered is-striped is-narrow is-hoverable'>
                                <thead>
                                    <tr>
                                        <th>Key</th>
                                        <th>Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.keys(
                                        this.props.detail.properties
                                    ).map(key => (
                                        <tr key={key}>
                                            <td>{key}</td>
                                            <td
                                                className='is-copyable'
                                                onClick={copy}
                                            >
                                                {printProperty(
                                                    this.props.detail
                                                        .properties[key]
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}
                </ClipboardContext.Consumer>
            );
        }

        if (this.props.detail instanceof _Relationship) {
            return (
                <ClipboardContext.Consumer>
                    {copy => (
                        <>
                            <div className='buttons mb-3'>
                                <Button
                                    onClick={() =>
                                        this.props.tabManager.add(
                                            {
                                                prefix: 'Rel',
                                                i: this.props.detail.identity,
                                            },
                                            'fa-solid fa-pen-to-square',
                                            EPage.Rel,
                                            {
                                                id: db.getId(this.props.detail),
                                                database: this.props.database,
                                            }
                                        )
                                    }
                                    icon='fa-solid fa-pen-clip'
                                    text={
                                        '#' +
                                        db.strInt(this.props.detail.identity)
                                    }
                                />
                                {this.props.stashManager.button(
                                    this.props.detail,
                                    this.props.database
                                )}
                            </div>

                            <div className='buttons mb-0'>
                                {this.typeButton(
                                    (this.props.detail as _Relationship).type,
                                    false
                                )}
                            </div>

                            {db.hasElementId && (
                                <>
                                    <p className='subtitle is-5 mt-3 mb-1'>
                                        ElementId
                                    </p>
                                    <span
                                        className='is-copyable'
                                        onClick={copy}
                                    >
                                        {this.props.detail.elementId}
                                    </span>
                                </>
                            )}

                            <p className='subtitle is-5 mt-3 mb-1'>
                                Properties
                            </p>
                            <table className='table is-bordered is-striped is-narrow is-hoverable'>
                                <thead>
                                    <tr>
                                        <th>Key</th>
                                        <th>Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.keys(
                                        this.props.detail.properties
                                    ).map(key => (
                                        <tr key={key}>
                                            <td>{key}</td>
                                            <td
                                                className='is-copyable'
                                                onClick={copy}
                                            >
                                                {printProperty(
                                                    this.props.detail
                                                        .properties[key]
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}
                </ClipboardContext.Consumer>
            );
        }

        return undefined;
    }
}

export default SidebarContent;
