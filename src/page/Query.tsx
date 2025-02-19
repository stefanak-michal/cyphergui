import { useState, useEffect, useContext } from 'react';
import { Button, Textarea } from '../components/form';
import { IPageProps } from '../utils/interfaces';
import db from '../db';
import { ClipboardContext } from '../utils/contexts';
import { Node as _Node, Path as _Path, Record, Relationship as _Relationship, ResultSummary } from 'neo4j-driver-lite';
import { Ecosystem, EPage, EQueryView } from '../utils/enums';
import { t_StashQuery } from '../utils/types';
import Table from './query/Table';
import Summary from './query/Summary';
import Json from './query/Json';
import Graph from './query/Graph';

interface IQueryProps extends IPageProps {
    query?: string;
    view?: EQueryView;
    execute?: boolean;
}

const Query: React.FC<IQueryProps> = props => {
    const [view, setView] = useState<EQueryView>(props.view || EQueryView.Table);
    const [tableSize, setTableSize] = useState<number>(parseInt(localStorage.getItem('query.tableSize') || '2'));
    const [query, setQuery] = useState<string>(props.query || '');
    const [rows, setRows] = useState<Record[]>([]);
    const [summary, setSummary] = useState<ResultSummary | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [keys, setKeys] = useState<string[]>([]);
    const [database, setDatabase] = useState<string | null>(null);
    const [showTableSize, setShowTableSize] = useState<boolean>(false);
    const copy = useContext(ClipboardContext);

    // let showTableSize = false;

    useEffect(() => {
        if (props.execute) handleSubmit(null);
    }, []);

    const updateShowTableSize = (value: any) => {
        if (Array.isArray(value)) {
            value.forEach(updateShowTableSize);
        } else if (value !== null && typeof value === 'object') {
            if (value instanceof _Node || value instanceof _Relationship || value instanceof _Path)
                setShowTableSize(true);
            else updateShowTableSize(Object.values(value));
        }
    };

    const handleSubmit = (e: React.FormEvent | null) => {
        if (e) e.preventDefault();
        setShowTableSize(false);
        setLoading(true);
        setRows([]);
        setSummary(null);

        db.query(query, {}, db.database)
            .then(response => {
                if (/\s*(CREATE|DROP)\s+(COMPOSITE\s+)?DATABASE/i.test(query)) {
                    db.query('SHOW DATABASES')
                        .then(response => {
                            db.databases = response.records
                                .filter(row => !row.has('type') || row.get('type') !== 'system')
                                .map(row => (db.ecosystem === Ecosystem.Memgraph ? row.get('Name') : row.get('name')));
                        })
                        .catch(() => {});
                }

                const keys: Set<string> = new Set();
                response.records.forEach(r => r.keys.forEach(keys.add, keys));

                updateShowTableSize(response.records);
                setSummary(response.summary);
                setRows(response.records);
                setError(null);
                setLoading(false);
                setView(response.records.length === 0 ? EQueryView.Summary : view);
                setKeys(Array.from(keys));
                setDatabase(db.database);
            })
            .catch(err => {
                setRows([]);
                setSummary(null);
                setError('[' + err.name + '] ' + err.message);
                setLoading(false);
            });
    };

    const changeView = (i: EQueryView) => {
        setView(i);
    };

    const handleSetTableSize = (i: number) => {
        setTableSize(i);
        localStorage.setItem('query.tableSize', i.toString());
    };

    return (
        <>
            <form onSubmit={handleSubmit} className='block'>
                <div className='field'>
                    <div className='control has-icons-right has-icons-left'>
                        <Textarea
                            required
                            name='query'
                            value={query}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                setQuery(e.currentTarget.value);
                                props.tabManager.add(
                                    props.tabName,
                                    'fa-solid fa-terminal',
                                    EPage.Query,
                                    { query: e.currentTarget.value },
                                    props.tabId
                                );
                            }}
                            color='is-family-code is-pre-wrap'
                            focus={true}
                            onKeyDown={(e: React.KeyboardEvent) => {
                                if (e.key === 'Enter' && e.ctrlKey) handleSubmit(null);
                            }}
                            highlight={{
                                mark: [
                                    'CALL',
                                    'CREATE',
                                    'DELETE',
                                    'DETACH',
                                    'FOREACH',
                                    'LOAD',
                                    'MATCH',
                                    'MERGE',
                                    'OPTIONAL',
                                    'REMOVE',
                                    'RETURN',
                                    'SET',
                                    'START',
                                    'UNION',
                                    'UNWIND',
                                    'WITH',
                                ],
                                '#995800': ['LIMIT', 'ORDER', 'SKIP', 'WHERE', 'YIELD'],
                                '#c07817': ['ASC', 'ASCENDING', 'ASSERT', 'BY', 'CSV', 'DESC', 'DESCENDING', 'ON'],
                                '#1732c0': ['ALL', 'CASE', 'COUNT', 'ELSE', 'END', 'EXISTS', 'THEN', 'WHEN'],
                                '#1683b3': [
                                    'AND',
                                    'AS',
                                    'CONTAINS',
                                    'DISTINCT',
                                    'ENDS',
                                    'IN',
                                    'IS',
                                    'NOT',
                                    'OR',
                                    'STARTS',
                                    'XOR',
                                ],
                                '#a00726': ['CONSTRAINT', 'CREATE', 'DROP', 'EXISTS', 'INDEX', 'NODE', 'KEY', 'UNIQUE'],
                                '#ba1919': ['INDEX', 'JOIN', 'SCAN', 'USING'],
                                '#0f00b4': ['false', 'null', 'true'],
                            }}
                        />
                        <span className='icon is-left'>
                            <i className='fa-solid fa-terminal' aria-hidden='true' />
                        </span>
                        <span className='icon is-right is-clickable' onClick={copy}>
                            <i className='fa-regular fa-copy' />
                        </span>
                    </div>
                </div>
                <div className='field'>
                    <div className='buttons is-justify-content-flex-end'>
                        <Button
                            color={'is-success ' + (loading ? 'is-loading' : '')}
                            type='submit'
                            icon='fa-solid fa-check'
                            text='Execute'
                        />
                        <a
                            href={
                                db.ecosystem === Ecosystem.Memgraph
                                    ? 'https://memgraph.com/docs/querying'
                                    : 'https://neo4j.com/docs/cypher-manual/'
                            }
                            target='_blank'
                            className='button'
                            title='Cypher documentation'
                        >
                            <span className='icon'>
                                <i className='fa-solid fa-book' />
                            </span>
                        </a>
                        {props.stashManager.button(new t_StashQuery(props.tabId, query), '')}
                        <Button
                            icon='fa-solid fa-xmark'
                            text='Close'
                            onClick={e => props.tabManager.close(props.tabId, e)}
                        />
                    </div>
                </div>
            </form>

            {typeof error === 'string' && (
                <div className='message is-danger block'>
                    <div className='message-header'>
                        <p>Error</p>
                        <button className='delete' aria-label='delete' onClick={() => setError(null)} />
                    </div>
                    <div className='message-body'>{error}</div>
                </div>
            )}

            <div className='block'>
                <div className='buttons has-addons'>
                    <span>
                        <Button
                            text='Table'
                            color={view === EQueryView.Table ? 'is-link is-light is-active' : ''}
                            icon='fa-solid fa-table'
                            onClick={() => changeView(EQueryView.Table)}
                        />
                        <Button
                            text='JSON'
                            color={view === EQueryView.JSON ? 'is-link is-light is-active' : ''}
                            icon='fa-brands fa-js'
                            onClick={() => changeView(EQueryView.JSON)}
                        />
                        <Button
                            text='Graph'
                            color={view === EQueryView.Graph ? 'is-link is-light is-active' : ''}
                            icon='fa-solid fa-circle-nodes'
                            onClick={() => changeView(EQueryView.Graph)}
                        />
                        <Button
                            text='Summary'
                            color={view === EQueryView.Summary ? 'is-link is-light is-active' : ''}
                            icon='fa-solid fa-gauge-high'
                            onClick={() => changeView(EQueryView.Summary)}
                        />
                    </span>
                    {view === EQueryView.Table && showTableSize && (
                        <span className='ml-3'>
                            <Button
                                color={tableSize === 1 ? 'is-link is-light is-active' : ''}
                                icon='fa-solid fa-arrows-up-down is-size-7'
                                onClick={() => handleSetTableSize(1)}
                            >
                                <span className='is-size-7'>Small</span>
                            </Button>
                            <Button
                                text='Medium'
                                color={tableSize === 2 ? 'is-link is-light is-active' : ''}
                                icon='fa-solid fa-arrows-up-down'
                                onClick={() => handleSetTableSize(2)}
                            />
                        </span>
                    )}
                </div>
            </div>

            {view === EQueryView.Table && rows.length > 0 && (
                <Table keys={keys} rows={rows} tableSize={tableSize} tabManager={props.tabManager} />
            )}

            {view === EQueryView.Graph && rows.length > 0 && (
                <Graph
                    rows={rows}
                    tabManager={props.tabManager}
                    stashManager={props.stashManager}
                    database={database}
                />
            )}

            {view === EQueryView.JSON && rows.length > 0 && <Json rows={rows} />}

            {view === EQueryView.Summary && summary && <Summary summary={summary} />}

            {rows.length === 0 && !summary && <div className='block'>No result</div>}
        </>
    );
};

export default Query;
