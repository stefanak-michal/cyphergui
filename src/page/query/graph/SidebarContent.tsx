import { Node as _Node, Relationship as _Relationship } from 'neo4j-driver-lite';
import { useContext } from 'react';
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

const SidebarContent: React.FC<ISidebarProps> = props => {
    const copy = useContext(ClipboardContext);

    const isColorDark = (color: string): boolean => {
        color = color.replace('#', '');
        const rgb = parseInt(color, 16); // convert rrggbb to decimal
        const r = (rgb >> 16) & 0xff; // extract red
        const g = (rgb >> 8) & 0xff; // extract green
        const b = (rgb >> 0) & 0xff; // extract blue
        return 0.2126 * r + 0.7152 * g + 0.0722 * b < 175; // per ITU-R BT.709
    };

    const labelButton = (label: string, modal: boolean = true): React.ReactElement => {
        return (
            <button
                className={
                    'button tag is-rounded px-2 is-medium ' +
                    (isColorDark(props.nodeStyles[label].color) ? 'has-text-white' : 'has-text-black')
                }
                key={label}
                style={{ backgroundColor: props.nodeStyles[label].color }}
                onClick={() =>
                    modal
                        ? props.labelClick(label)
                        : props.tabManager.add(label, 'fa-regular fa-circle', EPage.Label, {
                              label: label,
                              database: props.database,
                          })
                }
            >
                :{label} {modal ? '(' + props.labels[label] + ')' : ''}
            </button>
        );
    };

    const typeButton = (type: string, modal: boolean = true): React.ReactElement => {
        return (
            <button
                className={
                    'button tag is-rounded px-2 is-medium ' +
                    (isColorDark(props.edgeStyles[type].color) ? 'has-text-white' : '')
                }
                key={type}
                style={{ backgroundColor: props.edgeStyles[type].color }}
                onClick={() =>
                    modal
                        ? props.typeClick(type)
                        : props.tabManager.add(type, 'fa-solid fa-arrow-right-long', EPage.Type, {
                              type: type,
                              database: props.database,
                          })
                }
            >
                :{type} {modal ? '(' + props.types[type] + ')' : ''}
            </button>
        );
    };

    if (props.detail === null) {
        return (
            <>
                {Object.keys(props.labels).length > 0 && (
                    <>
                        <p className='subtitle is-5 mb-1'>Node Labels</p>
                        <span className='buttons'>{Object.keys(props.labels).map(label => labelButton(label))}</span>
                    </>
                )}

                {Object.keys(props.types).length > 0 && (
                    <>
                        <p className='subtitle is-5 mb-1'>Relationship Types</p>
                        <span className='buttons'>{Object.keys(props.types).map(type => typeButton(type))}</span>
                    </>
                )}
            </>
        );
    }

    if (props.detail instanceof _Node) {
        return (
            <>
                <div className='buttons mb-3'>
                    <Button
                        onClick={() =>
                            props.tabManager.add(
                                {
                                    prefix: 'Node',
                                    i: props.detail.identity,
                                },
                                'fa-solid fa-pen-to-square',
                                EPage.Node,
                                {
                                    id: db.getId(props.detail),
                                    database: props.database,
                                }
                            )
                        }
                        icon='fa-solid fa-pen-clip'
                        text={'#' + db.strInt(props.detail.identity)}
                    />
                    {props.stashManager.button(props.detail, props.database)}
                </div>

                <div className='buttons mb-0'>
                    {(props.detail as _Node).labels.map(label => labelButton(label, false))}
                </div>

                {db.hasElementId && (
                    <>
                        <p className='subtitle is-5 mt-3 mb-1'>ElementId</p>
                        <span className='is-copyable' onClick={copy}>
                            {props.detail.elementId}
                        </span>
                    </>
                )}

                <p className='subtitle is-5 mt-3 mb-1'>Properties</p>
                <table className='table is-bordered is-striped is-narrow is-hoverable'>
                    <thead>
                        <tr>
                            <th>Key</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(props.detail.properties).map(key => (
                            <tr key={key}>
                                <td>{key}</td>
                                <td className='is-copyable' onClick={copy}>
                                    {printProperty(props.detail.properties[key])}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </>
        );
    }

    if (props.detail instanceof _Relationship) {
        return (
            <>
                <div className='buttons mb-3'>
                    <Button
                        onClick={() =>
                            props.tabManager.add(
                                {
                                    prefix: 'Rel',
                                    i: props.detail.identity,
                                },
                                'fa-solid fa-pen-to-square',
                                EPage.Rel,
                                {
                                    id: db.getId(props.detail),
                                    database: props.database,
                                }
                            )
                        }
                        icon='fa-solid fa-pen-clip'
                        text={'#' + db.strInt(props.detail.identity)}
                    />
                    {props.stashManager.button(props.detail, props.database)}
                </div>

                <div className='buttons mb-0'>{typeButton((props.detail as _Relationship).type, false)}</div>

                {db.hasElementId && (
                    <>
                        <p className='subtitle is-5 mt-3 mb-1'>ElementId</p>
                        <span className='is-copyable' onClick={copy}>
                            {props.detail.elementId}
                        </span>
                    </>
                )}

                <p className='subtitle is-5 mt-3 mb-1'>Properties</p>
                <table className='table is-bordered is-striped is-narrow is-hoverable'>
                    <thead>
                        <tr>
                            <th>Key</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(props.detail.properties).map(key => (
                            <tr key={key}>
                                <td>{key}</td>
                                <td className='is-copyable' onClick={copy}>
                                    {printProperty(props.detail.properties[key])}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </>
        );
    }

    return null;
};

export default SidebarContent;
