import { useState, useEffect, useContext, useActionState, useRef } from 'react';
import { Button } from '../components/form';
import { Node as _Node, Relationship as _Relationship } from 'neo4j-driver-lite';
import { EPage, EPropertyType } from '../utils/enums';
import { IPageProps } from '../utils/interfaces';
import db from '../db';
import { ClipboardContext } from '../utils/contexts';
import Modal, { DeleteModal } from '../components/Modal';
import { settings } from '../layout/Settings';
import InlineRelationship from '../components/InlineRelationship';
import InlineNode from '../components/InlineNode';
import { t_FormProperty, t_FormValue } from '../utils/types';
import PropertiesForm from '../components/PropertiesForm';
import {
    getPropertyAsTemp,
    cypherPrintProperties,
    resolvePropertyType,
    sanitizeFormValues,
    getPropertyDefaultValue,
} from '../utils/fn';

interface INodeProps extends IPageProps {
    database: string;
    label: string;
    id: number | string | null;
}

const Node: React.FC<INodeProps> = props => {
    const [node, setNode] = useState<_Node | null>(null);
    const [labels, setLabels] = useState<string[]>(props.label ? [props.label] : []);
    const [properties, setProperties] = useState<t_FormProperty[]>([]);
    const [labelModal, setLabelModal] = useState<boolean | string[]>(false);
    const [labelModalInput, setLabelModalInput] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [deleteState, setDeleteState] = useState<number | string | false>(false);
    const [showAllRels, setShowAllRels] = useState<boolean>(false);
    const [rels, setRels] = useState<_Relationship[]>([]);
    const [nodes, setNodes] = useState<_Node[]>([]);
    const latestRequest = useRef<AbortController>(null);
    const copy = useContext(ClipboardContext);
    const create: boolean = props.id === null;

    const requestData = async () => {
        if (create) return;

        latestRequest.current?.abort();
        const ac: AbortController = new AbortController();
        latestRequest.current = ac;

        try {
            const response = await db.query(
                'MATCH (n) WHERE ' +
                    db.fnId() +
                    ' = $id OPTIONAL MATCH (n)-[r]-(a) RETURN n, collect(DISTINCT r) AS r, collect(DISTINCT a) AS a',
                {
                    id: props.id,
                },
                props.database
            );

            if (response.records.length === 0) {
                props.tabManager.close(props.tabId);
                return;
            }

            if (ac.signal.aborted) return;

            const node: _Node = response.records[0].get('n');
            const formProps: t_FormProperty[] = [];
            const t = new Date().getTime();
            for (const key in node.properties) {
                const type = resolvePropertyType(node.properties[key]);
                if (type === EPropertyType.List) {
                    const subtype = resolvePropertyType(node.properties[key][0]);
                    node.properties[key] = (node.properties[key] as []).map(p => {
                        return {
                            value: p,
                            type: subtype,
                            temp: getPropertyAsTemp(subtype, p),
                        } as t_FormValue;
                    });
                }
                if (type === EPropertyType.Map) {
                    const mapAsFormValue: t_FormValue[] = [];
                    for (const k in node.properties[key] as object) {
                        const subtype = resolvePropertyType(node.properties[key][k]);
                        mapAsFormValue.push({
                            key: k,
                            value: node.properties[key][k],
                            type: subtype,
                            temp: getPropertyAsTemp(subtype, node.properties[key][k]),
                        } as t_FormValue);
                    }
                    node.properties[key] = mapAsFormValue;
                }
                formProps.push({
                    name: key + t,
                    key: key,
                    value: node.properties[key],
                    type: type,
                    temp: getPropertyAsTemp(type, node.properties[key]),
                });
            }
            formProps.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

            if (ac.signal.aborted) return;

            setRels(response.records[0].get('r') as _Relationship[]);
            setNodes(response.records[0].get('a') as _Node[]);
            setNode(node);
            setLabels([...node.labels]);
            setProperties(formProps);
        } catch (err) {
            console.info(err);
            props.tabManager.close(props.tabId);
        }
    };

    useEffect(() => {
        requestData();
    }, []);

    useEffect(() => {
        if (!create && props.active) {
            db.query(
                'MATCH (n) WHERE ' + db.fnId() + ' = $id RETURN COUNT(n) AS c',
                {
                    id: props.id,
                },
                props.database
            )
                .then(response => {
                    if (db.fromInt(response.records[0].get('c')) !== 1) {
                        props.tabManager.close(props.tabId, null, false);
                    }
                })
                .catch(() => props.tabManager.close(props.tabId, null, false));
        }
    }, [props.active]);

    const handleLabelOpenModal = () => {
        db.query(
            'MATCH (n) WITH DISTINCT labels(n) AS ll UNWIND ll AS l RETURN collect(DISTINCT l) AS c',
            {},
            props.database
        )
            .then(response => {
                setLabelModal(response.records[0].get('c').filter(l => !labels.includes(l)));
            })
            .catch(err => setError('[' + err.name + '] ' + err.message));
    };

    const handleLabelSelect = (label: string, isExistingLabel: boolean = false) => {
        setLabels(state => {
            return !state.includes(label) ? state.concat(label) : state;
        });
        setLabelModal(false);
        setLabelModalInput('');
        markChanged();

        // If creating a new node and an existing label was selected, fetch and add properties
        if (create && isExistingLabel) {
            db.query('MATCH (n:' + label + ') RETURN n LIMIT 1', {}, props.database)
                .then(response => {
                    if (response.records.length === 0) return;

                    const node: _Node = response.records[0].get('n');
                    const existingKeys = properties.map(p => p.key);
                    const newProperties: t_FormProperty[] = [];
                    const t = new Date().getTime();
                    let timestampOffset = 0;

                    for (const key in node.properties) {
                        if (!existingKeys.includes(key)) {
                            const type = resolvePropertyType(node.properties[key]);
                            const timestamp = t + timestampOffset++;
                            const value = getPropertyDefaultValue(type);

                            newProperties.push({
                                name: key + timestamp,
                                key: key,
                                value: value,
                                type: type,
                                temp: getPropertyAsTemp(type, value),
                            });
                        }
                    }

                    if (newProperties.length > 0) {
                        setProperties(state => {
                            const combined = [...state, ...newProperties];
                            combined.sort((a, b) => a.key.toLowerCase().localeCompare(b.key.toLowerCase()));
                            return combined;
                        });
                    }
                })
                .catch(err => console.error('Failed to fetch node with label:', err));
        }
    };

    const [, labelModalAction, labelModalPending] = useActionState(() => {
        handleLabelSelect(labelModalInput);
    }, null);

    const handleLabelInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value: string = e.currentTarget.value;

        if (settings().forceNamingRecommendations) {
            value = value
                .replace(/^[^a-zA-Z]*/, '')
                .replace(/^[a-z]/, x => x.toUpperCase())
                .replace(/_[a-zA-Z]/, x => x.substring(1).toUpperCase());
        }

        setLabelModalInput(value);
    };

    const handleLabelDelete = (label: string) => {
        setLabels(state => {
            const labels = [...state];
            const i = state.indexOf(label);
            if (i !== -1) labels.splice(i, 1);
            return labels;
        });
        markChanged();
    };

    const handleLabelModalClose = () => {
        setLabelModal(false);
    };

    const handleSubmit = async (): Promise<void> => {
        const { query, props: queryProps } = generateQuery();

        return db
            .query(
                query,
                {
                    id: props.id,
                    p: queryProps,
                },
                props.database
            )
            .then(response => {
                if (response.summary.counters.containsUpdates()) {
                    props.toast(create ? 'Node created' : 'Node updated');
                }
                if (settings().closeEditAfterExecuteSuccess) {
                    props.tabManager.close(props.tabId, null, false);
                    return;
                }
                if (create) {
                    const node = response.records[0].get('n');
                    props.tabManager.add(
                        {
                            prefix: node.labels.length > 0 ? ':' + node.labels.join(':') : 'Node',
                            i: node.identity,
                        },
                        'fa-solid fa-pen-to-square',
                        EPage.Node,
                        {
                            id: db.getId(node),
                            database: props.database,
                        }
                    );
                    props.tabManager.close(props.tabId, null, false);
                }
            })
            .catch(err => setError('[' + err.name + '] ' + err.message));
    };

    const [, formAction, formPending] = useActionState(handleSubmit, null);

    const generateQuery = (printable: boolean = false): { query: string; props: object } => {
        let setLabels = !create ? labels.filter(l => !node.labels.includes(l)).join(':') : labels.join(':');
        if (setLabels.length > 0) setLabels = ' SET n:' + setLabels;
        let removeLabels = !create ? node.labels.filter(l => !labels.includes(l)).join(':') : '';
        if (removeLabels.length > 0) removeLabels = ' REMOVE n:' + removeLabels;

        const formValues = sanitizeFormValues(properties);
        let query: string = '';
        if (printable) {
            if (!create)
                query +=
                    'MATCH (n) WHERE ' +
                    db.fnId() +
                    ' = ' +
                    (typeof props.id === 'string' ? "'" + props.id + "'" : props.id);
            else query += 'CREATE (n)';
            query += setLabels + removeLabels;
            if (properties.length) {
                query += ' SET n = ' + cypherPrintProperties(properties);
            }
        } else {
            query +=
                (!create ? 'MATCH (n) WHERE ' + db.fnId() + ' = $id' : 'CREATE (n)') +
                setLabels +
                removeLabels +
                ' SET n = $p RETURN n';
        }

        return { query: query, props: formValues };
    };

    const handleDeleteModalConfirm = (id: number | string, detach: boolean) => {
        db.query(
            'MATCH (n) WHERE ' + db.fnId() + ' = $id ' + (detach ? 'DETACH ' : '') + 'DELETE n',
            {
                id: id,
            },
            props.database
        )
            .then(response => {
                if (response.summary.counters.updates().nodesDeleted > 0) {
                    props.tabManager.close(props.tabId, null, false);
                    props.toast('Node deleted');
                }
            })
            .catch(error => {
                setError(error.message);
            });
    };

    const markChanged = () => {
        props.tabManager.setChanged(
            props.tabId,
            create ||
                node.labels.sort().toString() !== labels.sort().toString() ||
                Object.keys(node.properties).sort().toString() !==
                    properties
                        .map(p => p.key)
                        .sort()
                        .toString() ||
                properties.some(p => p.value.toString() !== node.properties[p.key].toString())
        );
    };

    if (!create && node === null) {
        return <span className='has-text-grey-light'>Loading...</span>;
    }

    return (
        <>
            {deleteState && (
                <DeleteModal
                    delete={deleteState}
                    detach
                    handleConfirm={handleDeleteModalConfirm}
                    handleClose={() => setDeleteState(false)}
                />
            )}

            {Array.isArray(labelModal) && (
                <Modal title='Add label' icon='fa-solid fa-tag' handleClose={handleLabelModalClose}>
                    <div className='buttons'>
                        {labelModal.map(label => (
                            <Button
                                text={label}
                                color='is-link is-rounded tag is-medium'
                                key={label}
                                onClick={() => handleLabelSelect(label, true)}
                            />
                        ))}
                    </div>
                    <form action={labelModalAction}>
                        <label className='label'>Or specify new one</label>
                        <div className='field is-grouped'>
                            <div className='control is-expanded'>
                                <input
                                    autoFocus
                                    pattern='^[A-Za-z][A-Za-z_0-9]*$'
                                    required
                                    className='input'
                                    type='text'
                                    value={labelModalInput}
                                    onChange={handleLabelInput}
                                />
                            </div>
                            <div className='control'>
                                <Button icon='fa-solid fa-check' type='submit' disabled={labelModalPending} />
                            </div>
                        </div>
                    </form>
                </Modal>
            )}

            <form action={formAction}>
                {!create && (
                    <div className='columns'>
                        <div className={'column ' + (db.hasElementId ? 'is-half-desktop' : '')}>
                            <div className='field'>
                                <label className='label' htmlFor='node-identity'>
                                    identity
                                </label>
                                <div className='control' onClick={copy}>
                                    <input
                                        id='node-identity'
                                        className='input is-copyable'
                                        readOnly
                                        type='text'
                                        value={db.strInt(node.identity)}
                                    />
                                </div>
                            </div>
                        </div>
                        {db.hasElementId && (
                            <div className='column is-half-desktop'>
                                <div className='field'>
                                    <label className='label' htmlFor='node-elementId'>
                                        elementId
                                    </label>
                                    <div className='control' onClick={copy}>
                                        <input
                                            id='node-elementId'
                                            className='input is-copyable'
                                            readOnly
                                            type='text'
                                            value={node.elementId}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <fieldset className='box'>
                    <legend className='tag is-link is-light'>
                        <i className='fa-solid fa-tags mr-2' />
                        Labels
                    </legend>
                    <div className='buttons tags'>
                        {labels.map(label => (
                            <span key={'label-' + label} className='tag is-link is-medium is-rounded'>
                                <a
                                    className='has-text-white mr-1'
                                    onClick={() =>
                                        props.tabManager.add(label, 'fa-regular fa-circle', EPage.Label, {
                                            label: label,
                                            database: props.database,
                                        })
                                    }
                                >
                                    {label}
                                </a>
                                <button className='delete' onClick={() => handleLabelDelete(label)} />
                            </span>
                        ))}
                        <Button icon='fa-solid fa-plus' onClick={handleLabelOpenModal} />
                    </div>
                </fieldset>

                <fieldset className='box'>
                    <legend className='tag is-link is-light'>
                        <i className='fa-solid fa-rectangle-list mr-2' />
                        Properties
                    </legend>
                    <PropertiesForm
                        properties={properties}
                        updateProperties={properties => {
                            setProperties(properties);
                            markChanged();
                        }}
                    />
                </fieldset>

                {rels.length > 0 && (
                    <fieldset className='box'>
                        <legend className='tag is-link is-light'>
                            <i className='fa-solid fa-circle-nodes mr-2' />
                            Relationships
                        </legend>
                        {(showAllRels ? rels : rels.slice(0, 3)).map(r => {
                            const dir = db.getId(r, 'startNodeElementId', 'start') === props.id ? 1 : 2;
                            const node = nodes.find(
                                n =>
                                    db.getId(n) ===
                                    db.getId(
                                        r,
                                        dir === 2 ? 'startNodeElementId' : 'endNodeElementId',
                                        dir === 2 ? 'start' : 'end'
                                    )
                            );

                            return (
                                <div
                                    key={db.strInt(r.identity)}
                                    className='is-flex is-align-items-center is-justify-content-flex-start mb-3 mb-last-none'
                                >
                                    <i className='fa-regular fa-circle' />
                                    <span className='is-size-4'>
                                        {dir === 2 && '<'}
                                        -[
                                    </span>
                                    <InlineRelationship rel={r} tabManager={props.tabManager} small={true} />
                                    <span className='is-size-4'>]-{dir === 1 && '>'}(</span>
                                    <InlineNode node={node} tabManager={props.tabManager} small={true} />
                                    <span className=' is-size-4'>)</span>
                                    <span className='ml-auto'></span>
                                </div>
                            );
                        })}
                        {!showAllRels && rels.length > 3 && (
                            <Button
                                icon='fa-solid fa-caret-down'
                                text={'Show all (+' + (rels.length - 3) + ')'}
                                onClick={() => setShowAllRels(true)}
                            />
                        )}
                    </fieldset>
                )}

                <div className='mb-3' style={{ overflowY: 'auto' }}>
                    <span className='icon-text is-flex-wrap-nowrap'>
                        <span className='icon'>
                            <i className='fa-solid fa-terminal' aria-hidden='true' />
                        </span>
                        <span className='is-family-code is-pre-wrap is-copyable' onClick={copy}>
                            {generateQuery(true).query}
                        </span>
                    </span>
                </div>

                {error && (
                    <div className='message is-danger'>
                        <div className='message-header'>
                            <p>Error</p>
                            <button className='delete' aria-label='delete' onClick={() => setError(null)} />
                        </div>
                        <div className='message-body'>{error}</div>
                    </div>
                )}

                <div className='field'>
                    <div className='control buttons is-justify-content-flex-end'>
                        <Button
                            color={'is-success ' + (formPending ? 'is-loading' : '')}
                            type='submit'
                            icon='fa-solid fa-check'
                            text='Execute'
                            disabled={formPending}
                        />
                        {!create && props.stashManager.button(node, props.database)}
                        {!create && (
                            <Button
                                icon='fa-solid fa-refresh'
                                text='Reload'
                                onClick={() => {
                                    requestData();
                                    props.tabManager.setChanged(props.tabId, false);
                                }}
                            />
                        )}
                        <Button
                            icon='fa-solid fa-xmark'
                            text='Close'
                            onClick={e => props.tabManager.close(props.tabId, e)}
                        />
                        {!create && (
                            <Button
                                icon='fa-regular fa-trash-can'
                                color='is-danger'
                                text='Delete'
                                onClick={() => setDeleteState(db.getId(node))}
                            />
                        )}
                    </div>
                </div>
            </form>
        </>
    );
};

export default Node;
