import { useState, useEffect } from 'react';
import { IPageProps, IStashManager } from '../utils/interfaces';
import { Node as _Node, Relationship as _Relationship } from 'neo4j-driver-lite';
import { EPage, EPropertyType } from '../utils/enums';
import { Button } from '../components/form';
import db from '../db';
import { ClipboardContext } from '../utils/contexts';
import Modal, { DeleteModal } from '../components/Modal';
import { settings } from '../layout/Settings';
import InlineNode from '../components/InlineNode';
import PropertiesForm from '../components/PropertiesForm';
import { t_FormProperty, t_FormValue } from '../utils/types';
import { getPropertyAsTemp, cypherPrintProperties, resolvePropertyType, sanitizeFormValues } from '../utils/fn';

interface IRelationshipProps extends IPageProps {
    database: string;
    type: string;
    id: number | string | null;
}

const Relationship: React.FC<IRelationshipProps> = props => {
    const [rel, setRel] = useState<_Relationship | null>(null);
    const [start, setStart] = useState<_Node | null>(null);
    const [end, setEnd] = useState<_Node | null>(null);
    const [focus, setFocus] = useState<string | null>(null);
    const [type, setType] = useState<string>(props.type || '');
    const [properties, setProperties] = useState<t_FormProperty[]>([]);
    const [typeModal, setTypeModal] = useState<false | string[]>(false);
    const [typeModalInput, setTypeModalInput] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<number | string | false>(false);
    const [selectNodeModal, setSelectNodeModal] = useState<number | null>(null);

    const create = props.id === null;

    const requestData = () => {
        if (create) return;
        db.query('MATCH (a)-[r]->(b) WHERE ' + db.fnId('r') + ' = $id RETURN r, a, b', { id: props.id }, props.database)
            .then(response => {
                if (response.records.length === 0) {
                    props.tabManager.close(props.tabId);
                    return;
                }

                const rel: _Relationship = response.records[0].get('r');
                const formProps: t_FormProperty[] = [];
                const t = new Date().getTime();
                for (const key in rel.properties) {
                    const type = resolvePropertyType(rel.properties[key]);
                    if (type === EPropertyType.List) {
                        const subtype = resolvePropertyType(rel.properties[key][0]);
                        rel.properties[key] = (rel.properties[key] as []).map(p => {
                            return {
                                value: p,
                                type: subtype,
                                temp: getPropertyAsTemp(subtype, p),
                            } as t_FormValue;
                        });
                    }
                    if (type === EPropertyType.Map) {
                        const mapAsFormValue: t_FormValue[] = [];
                        for (const k in rel.properties[key] as object) {
                            const subtype = resolvePropertyType(rel.properties[key][k]);
                            mapAsFormValue.push({
                                key: k,
                                value: rel.properties[key][k],
                                type: subtype,
                                temp: getPropertyAsTemp(subtype, rel.properties[key][k]),
                            } as t_FormValue);
                        }
                        rel.properties[key] = mapAsFormValue;
                    }
                    formProps.push({
                        name: key + t,
                        key: key,
                        value: rel.properties[key],
                        type: type,
                        temp: getPropertyAsTemp(type, rel.properties[key]),
                    });
                }
                formProps.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
                setRel(rel);
                setStart(response.records[0].get('a') as _Node);
                setEnd(response.records[0].get('b') as _Node);
                setType(rel.type);
                setProperties(formProps);
            })
            .catch(() => props.tabManager.close(props.tabId));
    };

    useEffect(() => {
        requestData();
    }, []);

    useEffect(() => {
        if (!create && props.active) {
            db.query(
                'MATCH ()-[r]->() WHERE ' + db.fnId('r') + ' = $id RETURN COUNT(r) AS c',
                { id: props.id },
                props.database
            )
                .then(response => {
                    if (db.fromInt(response.records[0].get('c')) !== 1) {
                        props.tabManager.close(props.tabId);
                    }
                })
                .catch(() => props.tabManager.close(props.tabId));
        }
    }, [props.active]);

    const handleTypeOpenModal = () => {
        db.query('MATCH ()-[r]->() RETURN collect(DISTINCT type(r)) AS c', {}, props.database)
            .then(response => {
                setTypeModal((response.records[0].get('c') as string[]).filter(t => type !== t));
            })
            .catch(err => setError('[' + err.name + '] ' + err.message));
    };

    const handleTypeSelect = (type: string) => {
        setType(type);
        setTypeModal(false);
        setTypeModalInput('');
        markChanged();
    };

    const handleTypeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value: string = e.currentTarget.value;

        if (settings().forceNamingRecommendations) {
            value = value.replace(/^[^a-zA-Z]*/, '').replace(/[a-z]/, x => x.toUpperCase());
        }

        setTypeModalInput(value);
    };

    const handleTypeModalClose = () => {
        setTypeModal(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!type) {
            setError('Not defined relationship type');
            return false;
        }
        if (!start) {
            setError('Not defined start node');
            return false;
        }
        if (!end) {
            setError('Not defined end node');
            return false;
        }

        const { query, props: queryProps } = generateQuery();

        db.query(
            query,
            {
                id: rel ? (db.hasElementId ? rel.elementId : rel.identity) : null,
                a: db.hasElementId ? start.elementId : start.identity,
                b: db.hasElementId ? end.elementId : end.identity,
                p: queryProps,
            },
            props.database
        )
            .then(response => {
                if (response.summary.counters.containsUpdates()) {
                    props.toast(create ? 'Relationship created' : 'Relationship updated');
                }
                if (settings().closeEditAfterExecuteSuccess) {
                    props.tabManager.setChanged(props.tabId, false, () => {
                        props.tabManager.close(props.tabId);
                    });
                } else if (create || rel.start !== start.identity || rel.end !== end.identity) {
                    const rel = response.records[0].get('r');
                    props.tabManager.setChanged(props.tabId, false, () => {
                        props.tabManager.add(
                            { prefix: 'Rel', i: rel.identity },
                            'fa-solid fa-pen-to-square',
                            EPage.Rel,
                            {
                                id: db.getId(rel),
                                database: props.database,
                            }
                        );
                        props.tabManager.close(props.tabId);
                    });
                }
            })
            .catch(err => setError('[' + err.name + '] ' + err.message));
    };

    const generateQuery = (printable: boolean = false): { query: string; props: object } => {
        const props = sanitizeFormValues(properties);
        let query: string = '';
        const quoteId = (id: number | string): string => {
            if (typeof id === 'number') return id.toString();
            else return "'" + id + "'";
        };

        if (create) {
            query +=
                'MATCH (a) WHERE ' +
                db.fnId('a') +
                ' = ' +
                (start ? (printable ? quoteId(db.getId(start)) : '$a') : '');
            query +=
                ' MATCH (b) WHERE ' + db.fnId('b') + ' = ' + (end ? (printable ? quoteId(db.getId(end)) : '$b') : '');
            query += ' CREATE (a)-[r:' + type + ']->(b)';
        } else {
            const newStart = db.getId(rel, 'startNodeElementId', 'start') !== db.getId(start);
            const newEnd = db.getId(rel, 'endNodeElementId', 'end') !== db.getId(end);
            const willDelete = newStart || newEnd || rel.type !== type;

            query += 'MATCH ' + (newStart ? '()' : '(a)') + '-[r]->' + (newEnd ? '()' : '(b)');
            query += ' WHERE ' + db.fnId('r') + ' = ' + (printable ? quoteId(props.id) : '$id');
            if (newStart)
                query += ' MATCH (a) WHERE ' + db.fnId('a') + ' = ' + (printable ? quoteId(db.getId(start)) : '$a');
            if (newEnd)
                query += ' MATCH (b) WHERE ' + db.fnId('b') + ' = ' + (printable ? quoteId(db.getId(end)) : '$b');
            if (willDelete) query += ' DELETE r';
            if (willDelete) query += ' WITH a, b CREATE (a)-[r:' + type + ']->(b)';
        }

        if (printable) {
            if (properties.length) {
                query += ' SET r = ' + cypherPrintProperties(properties);
            }
        } else {
            query += ' SET r = $p RETURN r';
        }

        return { query: query, props: props };
    };

    const handleDeleteModalConfirm = (id: number | string) => {
        db.query('MATCH ()-[r]-() WHERE ' + db.fnId('r') + ' = $id DELETE r', { id: id }, props.database)
            .then(response => {
                if (response.summary.counters.updates().nodesDeleted > 0) {
                    props.tabManager.setChanged(props.tabId, false, () => props.tabManager.close(props.tabId));
                    props.toast('Relationship deleted');
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
                rel.type !== type ||
                rel.start !== start.identity ||
                rel.end !== end.identity ||
                Object.keys(rel.properties).sort().toString() !==
                    properties
                        .map(p => p.key)
                        .sort()
                        .toString() ||
                properties.some(p => p.value.toString() !== rel.properties[p.key].toString())
        );
    };

    if (!create && rel === null) {
        return <span className='has-text-grey-light'>Loading...</span>;
    }

    return (
        <>
            {deleteId && (
                <DeleteModal
                    delete={deleteId}
                    handleConfirm={handleDeleteModalConfirm}
                    handleClose={() => setDeleteId(false)}
                />
            )}

            {Array.isArray(typeModal) && (
                <Modal title='Set type' icon='fa-solid fa-tag' handleClose={handleTypeModalClose}>
                    <div className='buttons'>
                        {typeModal.map(label => (
                            <Button
                                text={label}
                                color='is-info is-rounded tag is-medium has-text-white'
                                key={label}
                                onClick={() => handleTypeSelect(label)}
                            />
                        ))}
                    </div>
                    <form
                        onSubmit={e => {
                            e.preventDefault();
                            handleTypeSelect(typeModalInput);
                            return true;
                        }}
                    >
                        <label className='label'>Or specify new one</label>
                        <div className='field is-grouped'>
                            <div className='control is-expanded'>
                                <input
                                    autoFocus
                                    pattern='^[A-Za-z][A-Za-z_0-9]*$'
                                    required
                                    className='input'
                                    type='text'
                                    value={typeModalInput}
                                    onChange={handleTypeInput}
                                />
                            </div>
                            <div className='control'>
                                <Button icon='fa-solid fa-check' type='submit' />
                            </div>
                        </div>
                    </form>
                </Modal>
            )}

            {selectNodeModal && (
                <SelectNodeModal
                    stashManager={props.stashManager}
                    handleNodeSelect={node => {
                        if (selectNodeModal === 1) {
                            setStart(node);
                            setSelectNodeModal(null);
                            markChanged();
                        } else {
                            setEnd(node);
                            setSelectNodeModal(null);
                            markChanged();
                        }
                    }}
                    handleClose={() => setSelectNodeModal(null)}
                    database={props.database}
                />
            )}

            <form onSubmit={handleSubmit}>
                {!create && (
                    <ClipboardContext.Consumer>
                        {copy => (
                            <div className='columns'>
                                <div className={'column ' + (db.hasElementId ? 'is-half-desktop' : '')}>
                                    <div className='field'>
                                        <label className='label' htmlFor='rel-identity'>
                                            identity
                                        </label>
                                        <div className='control' onClick={copy}>
                                            <input
                                                id='rel-identity'
                                                className='input is-copyable'
                                                readOnly
                                                type='text'
                                                value={db.strInt(rel.identity)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                {db.hasElementId && (
                                    <div className='column is-half-desktop'>
                                        <div className='field'>
                                            <label className='label' htmlFor='rel-elementId'>
                                                elementId
                                            </label>
                                            <div className='control' onClick={copy}>
                                                <input
                                                    id='rel-elementId'
                                                    className='input is-copyable'
                                                    readOnly
                                                    type='text'
                                                    value={rel.elementId}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </ClipboardContext.Consumer>
                )}

                <fieldset className='box'>
                    <legend className='tag is-link is-light'>
                        <i className='fa-solid fa-tags mr-2' />
                        Type
                    </legend>
                    <div className='buttons tags'>
                        {type && (
                            <span className='tag is-info is-medium is-rounded'>
                                <a
                                    className='has-text-white mr-1'
                                    onClick={() =>
                                        props.tabManager.add(type, 'fa-regular fa-circle', EPage.Type, {
                                            type: type,
                                            database: props.database,
                                        })
                                    }
                                >
                                    {type}
                                </a>
                            </span>
                        )}
                        <Button icon='fa-solid fa-pen-clip' onClick={handleTypeOpenModal} />
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

                <fieldset className='box'>
                    <legend className='tag is-link is-light'>
                        <i className='fa-solid fa-circle-nodes mr-2' />
                        Start node
                    </legend>
                    <div className='is-flex is-align-items-center is-justify-content-flex-start mb-3 mb-last-none'>
                        {start && <InlineNode node={start} tabManager={props.tabManager} />}
                        <span className='ml-auto'>
                            <Button icon='fa-solid fa-shuffle' text='Change' onClick={() => setSelectNodeModal(1)} />
                        </span>
                    </div>
                </fieldset>

                <fieldset className='box'>
                    <legend className='tag is-link is-light'>
                        <i className='fa-solid fa-circle-nodes mr-2' />
                        End node
                    </legend>
                    <div className='is-flex is-align-items-center is-justify-content-flex-start mb-3 mb-last-none'>
                        {end && <InlineNode node={end} tabManager={props.tabManager} />}
                        <span className='ml-auto'>
                            <Button icon='fa-solid fa-shuffle' text='Change' onClick={() => setSelectNodeModal(2)} />
                        </span>
                    </div>
                </fieldset>

                <div className='mb-3' style={{ overflowY: 'auto' }}>
                    <span className='icon-text is-flex-wrap-nowrap'>
                        <span className='icon'>
                            <i className='fa-solid fa-terminal' aria-hidden='true' />
                        </span>
                        <ClipboardContext.Consumer>
                            {copy => (
                                <span className='is-family-code is-pre-wrap is-copyable' onClick={copy}>
                                    {generateQuery(true).query}
                                </span>
                            )}
                        </ClipboardContext.Consumer>
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
                        <Button color='is-success' type='submit' icon='fa-solid fa-check' text='Execute' />
                        {!create && props.stashManager.button(rel, props.database)}
                        {!create && <Button icon='fa-solid fa-refresh' text='Reload' onClick={requestData} />}
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
                                onClick={() => setDeleteId(db.getId(rel))}
                            />
                        )}
                    </div>
                </div>
            </form>
        </>
    );
};

const SelectNodeModal: React.FC<{
    stashManager: IStashManager;
    handleNodeSelect: (node: _Node) => void;
    handleClose: () => void;
    database: string;
}> = ({ stashManager, handleNodeSelect, handleClose, database }) => {
    const [id, setId] = useState<string>('');
    const [error, setError] = useState<any>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const isNum = /^\d+$/.test(id);

        db.query(
            'MATCH (n) WHERE ' + (isNum ? 'id(n)' : 'elementId(n)') + ' = $id RETURN n',
            {
                id: isNum ? db.toInt(id) : id,
            },
            database
        )
            .then(response => {
                if (response.records.length > 0) {
                    handleNodeSelect(response.records[0].get('n'));
                    return true;
                } else {
                    setError('Node not found');
                    return false;
                }
            })
            .catch(err => {
                setError('[' + err.name + '] ' + err.message);
            });
    };

    return (
        <Modal title='Select node' icon='fa-regular fa-circle' handleClose={handleClose} backdrop={true}>
            <label className='label'>Stashed nodes</label>
            {stashManager.get().filter(s => s.value instanceof _Node).length > 0 ? (
                <div className='buttons'>
                    {stashManager
                        .get()
                        .filter(s => s.database === database && s.value instanceof _Node)
                        .map(s => (
                            <Button
                                key={s.id}
                                text={
                                    ((s.value as _Node).labels.length > 0
                                        ? ':' + (s.value as _Node).labels.join(':') + ' '
                                        : '') +
                                    '#' +
                                    db.strInt(s.value.identity)
                                }
                                onClick={() => handleNodeSelect(s.value as _Node)}
                            />
                        ))}
                </div>
            ) : (
                <div className='has-text-grey-light mb-3'>none</div>
            )}
            <form onSubmit={handleSubmit}>
                <label className='label'>Or enter id {db.hasElementId ? 'or elementId' : ''}</label>
                <div className='field is-grouped'>
                    <div className='control is-expanded'>
                        <input
                            autoFocus
                            required
                            className='input'
                            type='text'
                            value={id}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const target = e.currentTarget;
                                setId(target.value);
                                setError(null);
                            }}
                        />
                    </div>
                    <div className='control'>
                        <Button icon='fa-solid fa-check' type='submit' />
                    </div>
                </div>
                {error && <div className='notification is-danger'>{error}</div>}
            </form>
        </Modal>
    );
};

export default Relationship;
