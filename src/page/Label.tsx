import { useState, useEffect, useContext } from 'react';
import Pagination from '../components/Pagination';
import TableSortIcon from '../components/TableSortIcon';
import { Button, LabelButton } from '../components/form';
import { Node as _Node } from 'neo4j-driver-lite';
import { Ecosystem, EPage, EQueryView } from '../utils/enums';
import { IPageProps } from '../utils/interfaces';
import db from '../db';
import { DeleteModal } from '../components/Modal';
import { settings } from '../layout/Settings';
import { ClipboardContext } from '../utils/contexts';
import { printProperty } from '../utils/fn';

interface ILabelProps extends IPageProps {
    database: string;
    label: string;
}

const Label: React.FC<ILabelProps> = props => {
    const perPage = 20;
    const [rows, setRows] = useState<_Node[]>([]);
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

        let query: string = 'MATCH (' + (props.label.startsWith('*') ? 'n' : 'n:' + props.label) + ')';
        if (search.length) {
            switch (db.ecosystem) {
                case Ecosystem.Neo4j:
                    query += ' WHERE any(prop IN keys(n) WHERE toStringOrNull(n[prop]) STARTS WITH $search)';
                    break;
                case Ecosystem.Memgraph:
                    query +=
                        ' WHERE any(prop IN keys(n) WHERE NOT valueType(n[prop]) IN ["LIST", "MAP"] AND toString(n[prop]) STARTS WITH $search)';
                    break;
                default:
                    return;
            }
            if (checkId) query += ' OR id(n) = $id';
        }

        db.query(
            query + ' RETURN COUNT(n) AS cnt',
            {
                search: search,
                id: checkId ? db.toInt(search) : null,
            },
            props.database
        )
            .then(response1 => {
                const cnt: number = db.fromInt(response1.records[0].get('cnt'));
                const newPage: number = Math.min(page, Math.ceil(cnt / perPage));

                db.query(
                    query +
                        ' RETURN n ' +
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
                        setRows(response2.records.map(record => record.get('n')));
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
                    requestData();
                    props.toast('Node deleted');
                    const tabId = props.tabManager.generateId({ id: id, database: props.database });
                    props.tabManager.close(tabId, null, false);
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
        s = s.replace(/^n\.([^ ]+)(?: DESC)?$/, '$1');
        if (!keys.includes(s)) keys.push(s);
    }
    keys.sort();

    const additionalLabels = (() => {
        for (const row of rows) {
            for (const label of row.labels) {
                if (label !== props.label) {
                    return true;
                }
            }
        }
        return false;
    })();

    let printQuery: string = 'MATCH (' + (props.label.startsWith('*') ? 'n' : 'n:' + props.label) + ')';
    if (search.length) {
        switch (db.ecosystem) {
            case Ecosystem.Neo4j:
                printQuery += ' WHERE any(prop IN keys(n) WHERE toStringOrNull(n[prop]) STARTS WITH "' + search + '")';
                break;
            case Ecosystem.Memgraph:
                printQuery +=
                    ' WHERE any(prop IN keys(n) WHERE NOT valueType(n[prop]) IN ["LIST", "MAP"] AND toString(n[prop]) STARTS WITH "' +
                    search +
                    '")';
                break;
            default:
                return;
        }
        if (/^\d+$/.test(search)) printQuery += ' OR id(n) = ' + search;
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
                    detach
                    handleConfirm={handleDeleteModalConfirm}
                    handleClose={() => setDeleteId(false)}
                />
            )}

            {error && (
                <div className='message is-danger'>
                    <div className='message-header'>
                        <p>Error</p>
                        <button className='delete' aria-label='delete' onClick={() => setError(null)} />
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
                    text='Create node'
                    color='is-primary'
                    onClick={() =>
                        props.tabManager.add(
                            { prefix: 'New node' },
                            'fa-solid fa-square-plus',
                            EPage.Node,
                            {
                                id: null,
                                database: props.database,
                                label: props.label === '*' ? '' : props.label,
                            },
                            new Date().getTime().toString()
                        )
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
                            <th colSpan={settings().tableViewShowElementId && db.hasElementId ? 3 : 2}>Node</th>
                            {additionalLabels && <th rowSpan={2}>Additional labels</th>}
                            {keys.length > 0 ? <th colSpan={keys.length}>properties</th> : ''}
                        </tr>
                        <tr>
                            <th className='wspace-nowrap is-clickable' onClick={() => handleSetSort('id(n)')}>
                                id <TableSortIcon sort='id(n)' current={sort} />
                            </th>
                            {settings().tableViewShowElementId && db.hasElementId && (
                                <th
                                    className='wspace-nowrap is-clickable'
                                    onClick={() => handleSetSort('elementId(n)')}
                                >
                                    elementId <TableSortIcon sort='elementId(n)' current={sort} />
                                </th>
                            )}
                            <th></th>
                            {keys.map(key => (
                                <th
                                    key={'th-' + key}
                                    className='wspace-nowrap is-clickable'
                                    onClick={() => handleSetSort('n.' + key)}
                                >
                                    {key} <TableSortIcon sort={'n.' + key} current={sort} />
                                </th>
                            ))}
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
                                                    prefix: 'Node',
                                                    i: row.identity,
                                                },
                                                'fa-solid fa-pen-to-square',
                                                EPage.Node,
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
                                    <div className='buttons is-flex-wrap-nowrap'>
                                        {props.stashManager.button(row, props.database)}
                                        <Button
                                            icon='fa-regular fa-trash-can'
                                            color='is-danger is-outlined'
                                            title='Delete'
                                            onClick={() => setDeleteId(db.getId(row))}
                                        />
                                    </div>
                                </td>
                                {additionalLabels && (
                                    <td>
                                        <span className='buttons'>
                                            {row.labels
                                                .filter(value => value !== props.label)
                                                .map(label => (
                                                    <LabelButton
                                                        key={label}
                                                        label={label}
                                                        database={props.database}
                                                        tabManager={props.tabManager}
                                                    />
                                                ))}
                                        </span>
                                    </td>
                                )}
                                {keys.map(key => (
                                    <td key={'td-' + key}>
                                        {key in row.properties && printProperty(row.properties[key])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination page={page} pages={Math.ceil(total / perPage)} action={handleChangePage} />
        </>
    );
};

export default Label;
