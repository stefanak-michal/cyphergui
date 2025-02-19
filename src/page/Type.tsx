import { useState, useEffect, useContext } from 'react';
import Pagination from '../components/Pagination';
import { Relationship as Neo4jRelationship } from 'neo4j-driver-lite';
import { Button, TypeButton } from '../components/form';
import { Ecosystem, EPage, EQueryView } from '../utils/enums';
import { IPageProps } from '../utils/interfaces';
import TableSortIcon from '../components/TableSortIcon';
import { DeleteModal } from '../components/Modal';
import db from '../db';
import { settings } from '../layout/Settings';
import { ClipboardContext } from '../utils/contexts';
import { printProperty } from '../utils/fn';

interface ITypeProps extends IPageProps {
    database: string;
    type: string;
}

const Type: React.FC<ITypeProps> = props => {
    const perPage = 20;
    const [rows, setRows] = useState<Neo4jRelationship[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [sort, setSort] = useState<string[]>([]);
    const [deleteId, setDeleteId] = useState<number | string | false>(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [queryTabId, setQueryTabId] = useState<string | undefined>(undefined);
    const clipboardContext = useContext(ClipboardContext);
    let timeout: NodeJS.Timeout | null = null;

    const requestData = () => {
        const checkId = search.length ? /^\d+$/.test(search) : false;
        let query = 'MATCH (a)-[' + (props.type.startsWith('*') ? 'r' : 'r:' + props.type) + ']->(b)';
        if (search.length) {
            switch (db.ecosystem) {
                case Ecosystem.Neo4j:
                    query += ' WHERE any(prop IN keys(r) WHERE toStringOrNull(r[prop]) STARTS WITH $search)';
                    break;
                case Ecosystem.Memgraph:
                    query +=
                        ' WHERE any(prop IN keys(r) WHERE NOT valueType(r[prop]) IN ["LIST", "MAP"] AND toString(r[prop]) STARTS WITH $search)';
                    break;
                default:
                    return;
            }
            if (checkId) query += ' OR id(r) = $id OR id(a) = $id OR id(b) = $id';
        }

        db.query(
            query + ' RETURN COUNT(r) AS cnt',
            {
                search: search,
                id: checkId ? db.toInt(search) : null,
            },
            props.database
        )
            .then(response1 => {
                const cnt = db.fromInt(response1.records[0].get('cnt'));
                const newPage = Math.min(page, Math.ceil(cnt / perPage));

                db.query(
                    query +
                        ' RETURN r ' +
                        (sort.length ? 'ORDER BY ' + sort.join(', ') : '') +
                        ' SKIP $skip LIMIT $limit',
                    {
                        skip: db.toInt(Math.max(newPage - 1, 0) * perPage),
                        limit: db.toInt(perPage),
                        search: search,
                        id: checkId ? db.toInt(search) : null,
                    },
                    props.database
                )
                    .then(response2 => {
                        setRows(response2.records.map(record => record.get('r')));
                        setTotal(cnt);
                        setPage(Math.max(newPage, 1));
                    })
                    .catch(err => {
                        setError('[' + err.name + '] ' + err.message);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            })
            .catch(err => {
                setError('[' + err.name + '] ' + err.message);
                setLoading(false);
            });
    };

    useEffect(() => {
        requestData();
    }, []);

    useEffect(() => {
        if (props.active) requestData();
    }, [props.active, page, sort]);

    useEffect(() => {
        if (timeout !== null) clearTimeout(timeout);
        timeout = setTimeout(() => {
            requestData();
            timeout = null;
        }, 300);
    }, [search]);

    const handleChangePage = (newPage: number) => {
        setPage(newPage);
    };

    const handleClearError = () => {
        setError(null);
    };

    const handleDeleteModalConfirm = (id: number | string) => {
        db.query(
            'MATCH ()-[r]-() WHERE ' + db.fnId('r') + ' = $id DELETE r',
            {
                id: id,
            },
            props.database
        )
            .then(response => {
                if (response.summary.counters.updates().relationshipsDeleted > 0) {
                    requestData();
                    props.toast('Relationship deleted');
                    const tabId = props.tabManager.generateId({ id: id, database: props.database });
                    props.tabManager.setChanged(tabId, false, () => {
                        props.tabManager.close(tabId);
                    });
                }
            })
            .catch(error => {
                setError(error.message);
            });
    };

    const handleSetSort = (value: string) => {
        setSort(prevSort => {
            const i = prevSort.indexOf(value),
                j = prevSort.indexOf(value + ' DESC');
            const copy = [...prevSort];

            if (i !== -1) {
                copy[i] = value + ' DESC';
            } else if (j !== -1) {
                copy.splice(i, 1);
            } else {
                copy.push(value);
            }

            return copy;
        });
    };

    const handleSearch = (str: string = ''): void => {
        setSearch(str);
        setLoading(true);
    };

    const keys = [];
    for (const row of rows) {
        for (const k in row.properties) {
            if (!keys.includes(k)) {
                keys.push(k);
            }
        }
    }
    //add sorted keys which are not available in visible rows
    for (let s of sort) {
        s = s.replace(/^r\.([^ ]+)(?: DESC)?$/, '$1');
        if (!keys.includes(s)) keys.push(s);
    }
    keys.sort();

    let printQuery = 'MATCH (a)-[' + (props.type.startsWith('*') ? 'r' : 'r:' + props.type) + ']->(b)';
    if (search.length) {
        switch (db.ecosystem) {
            case Ecosystem.Neo4j:
                printQuery += ' WHERE any(prop IN keys(r) WHERE toStringOrNull(r[prop]) STARTS WITH "' + search + '")';
                break;
            case Ecosystem.Memgraph:
                printQuery +=
                    ' WHERE any(prop IN keys(r) WHERE NOT valueType(r[prop]) IN ["LIST", "MAP"] AND toString(r[prop]) STARTS WITH "' +
                    search +
                    '")';
                break;
            default:
                return;
        }
        if (/^\d+$/.test(search))
            printQuery += ' OR id(r) = ' + search + ' OR id(a) = ' + search + ' OR id(b) = ' + search;
    }
    printQuery +=
        ' RETURN n' +
        (sort.length ? ' ORDER BY ' + sort.join(', ') : '') +
        ' SKIP ' +
        Math.max(page - 1, 0) * perPage +
        ' LIMIT ' +
        perPage;

    return (
        <>
            {deleteId && (
                <DeleteModal
                    delete={deleteId}
                    handleConfirm={handleDeleteModalConfirm}
                    handleClose={() => setDeleteId(false)}
                />
            )}

            {typeof error === 'string' && (
                <div className='message is-danger'>
                    <div className='message-header'>
                        <p>Error</p>
                        <button className='delete' aria-label='delete' onClick={handleClearError} />
                    </div>
                    <div className='message-body'>{error}</div>
                </div>
            )}

            <div className='mb-3' style={{ overflowY: 'auto' }}>
                <span className='icon-text is-flex-wrap-nowrap'>
                    <span className='icon'>
                        <i className='fa-solid fa-terminal' aria-hidden='true' />
                    </span>
                    <span className='is-family-code is-pre-wrap is-copyable' onClick={clipboardContext}>
                        {printQuery}
                    </span>
                </span>
            </div>

            <div className='buttons mb-3'>
                <Button
                    icon='fa-solid fa-plus'
                    text='Create relationship'
                    color='is-primary'
                    onClick={() =>
                        props.tabManager.add({ prefix: 'New relationship' }, 'fa-regular fa-square-plus', EPage.Rel, {
                            id: null,
                            database: props.database,
                            type: props.type.startsWith('*') ? '' : props.type,
                        })
                    }
                />
                <Button
                    icon='fa-solid fa-circle-nodes'
                    text='View as graph'
                    onClick={() =>
                        setQueryTabId(
                            props.tabManager.add(
                                { prefix: 'Query' },
                                'fa-solid fa-terminal',
                                EPage.Query,
                                {
                                    query: printQuery,
                                    execute: true,
                                    view: EQueryView.Graph,
                                },
                                queryTabId
                            )
                        )
                    }
                />
                <div
                    className={'control has-icons-left is-align-self-flex-start ' + (loading ? 'border-progress' : '')}
                >
                    <input
                        className='input'
                        type='search'
                        placeholder='Search'
                        value={search}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.currentTarget.value)}
                    />
                    <span className='icon is-left'>
                        <i className='fas fa-search' aria-hidden='true' />
                    </span>
                </div>
            </div>

            <div className='table-container'>
                <table className='table is-bordered is-striped is-narrow is-hoverable'>
                    <thead>
                        <tr>
                            <th colSpan={settings().tableViewShowElementId && db.hasElementId ? 3 : 2}>Relationship</th>
                            {props.type.startsWith('*') && <th rowSpan={2}>Type</th>}
                            {keys.length > 0 ? <th colSpan={keys.length}>properties</th> : ''}
                            <th colSpan={settings().tableViewShowElementId && db.hasElementId ? 2 : 1}>Start node</th>
                            <th colSpan={settings().tableViewShowElementId && db.hasElementId ? 2 : 1}>End node</th>
                        </tr>
                        <tr>
                            <th
                                rowSpan={2}
                                className='wspace-nowrap is-clickable'
                                onClick={() => handleSetSort('id(r)')}
                            >
                                id <TableSortIcon sort='id(r)' current={sort} />
                            </th>
                            {settings().tableViewShowElementId && db.hasElementId && (
                                <th
                                    rowSpan={2}
                                    className='wspace-nowrap is-clickable'
                                    onClick={() => handleSetSort('elementId(r)')}
                                >
                                    elementId <TableSortIcon sort='elementId(r)' current={sort} />
                                </th>
                            )}
                            <th></th>
                            {keys.map(key => (
                                <th
                                    key={'th-' + key}
                                    className='wspace-nowrap is-clickable'
                                    onClick={() => handleSetSort('r.' + key)}
                                >
                                    {key} <TableSortIcon sort={'r.' + key} current={sort} />
                                </th>
                            ))}

                            <th className='wspace-nowrap is-clickable' onClick={() => handleSetSort('id(a)')}>
                                id <TableSortIcon sort={'id(a)'} current={sort} />
                            </th>
                            {settings().tableViewShowElementId && db.hasElementId && (
                                <th
                                    className='wspace-nowrap is-clickable'
                                    onClick={() => handleSetSort('elementId(a)')}
                                >
                                    elementId <TableSortIcon sort={'elementId(a)'} current={sort} />
                                </th>
                            )}
                            <th className='wspace-nowrap is-clickable' onClick={() => handleSetSort('id(b)')}>
                                id <TableSortIcon sort={'id(b)'} current={sort} />
                            </th>
                            {settings().tableViewShowElementId && db.hasElementId && (
                                <th
                                    className='wspace-nowrap is-clickable'
                                    onClick={() => handleSetSort('elementId(b)')}
                                >
                                    elementId <TableSortIcon sort={'elementId(b)'} current={sort} />
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(row => (
                            <tr key={'tr-' + db.strInt(row.identity)}>
                                <td>
                                    <Button
                                        onClick={() =>
                                            props.tabManager.add(
                                                {
                                                    prefix: 'Rel',
                                                    i: row.identity,
                                                },
                                                'fa-regular fa-pen-to-square',
                                                EPage.Rel,
                                                {
                                                    id: db.getId(row),
                                                    database: props.database,
                                                }
                                            )
                                        }
                                        icon='fa-solid fa-pen-clip'
                                        text={'#' + db.strInt(row.identity)}
                                    />
                                </td>
                                {settings().tableViewShowElementId && db.hasElementId && (
                                    <td className='wspace-nowrap'>{row.elementId}</td>
                                )}
                                <td>
                                    <div className='is-flex-wrap-nowrap buttons'>
                                        {props.stashManager.button(row, props.database)}
                                        <Button
                                            icon='fa-regular fa-trash-can'
                                            color='is-danger is-outlined'
                                            title='Delete'
                                            onClick={() => setDeleteId(db.getId(row))}
                                        />
                                    </div>
                                </td>
                                {props.type.startsWith('*') && (
                                    <td>
                                        <TypeButton
                                            type={row.type}
                                            database={props.database}
                                            tabManager={props.tabManager}
                                        />
                                    </td>
                                )}
                                {keys.map(key => (
                                    <td key={'td-' + key}>
                                        {key in row.properties && printProperty(row.properties[key])}
                                    </td>
                                ))}

                                <td>
                                    <Button
                                        onClick={() =>
                                            props.tabManager.add(
                                                {
                                                    prefix: 'Node',
                                                    i: row.start,
                                                },
                                                'fa-solid fa-pen-to-square',
                                                EPage.Node,
                                                {
                                                    id: db.getId(row, 'startNodeElementId', 'start'),
                                                    database: props.database,
                                                }
                                            )
                                        }
                                        icon='fa-solid fa-pen-clip'
                                        text={'#' + db.strInt(row.start)}
                                    />
                                </td>
                                {settings().tableViewShowElementId && db.hasElementId && (
                                    <td className='wspace-nowrap'>{row.startNodeElementId}</td>
                                )}
                                <td>
                                    <Button
                                        onClick={() =>
                                            props.tabManager.add(
                                                {
                                                    prefix: 'Node',
                                                    i: row.end,
                                                },
                                                'fa-solid fa-pen-to-square',
                                                EPage.Node,
                                                {
                                                    id: db.getId(row, 'endNodeElementId', 'end'),
                                                    database: props.database,
                                                }
                                            )
                                        }
                                        icon='fa-solid fa-pen-clip'
                                        text={'#' + db.strInt(row.end)}
                                    />
                                </td>
                                {settings().tableViewShowElementId && db.hasElementId && (
                                    <td className='wspace-nowrap'>{row.endNodeElementId}</td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination page={page} pages={Math.ceil(total / perPage)} action={handleChangePage} />
        </>
    );
};

export default Type;
