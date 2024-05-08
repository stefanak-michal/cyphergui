import * as React from 'react';
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

interface ITypeState {
    rows: Neo4jRelationship[];
    page: number;
    total: number;
    sort: string[];
    delete: number | string | false;
    error: string | null;
    search: string;
    loading: boolean;
}

/**
 * List all relationships with specific relationshipType
 */
class Type extends React.Component<ITypeProps, ITypeState> {
    perPage: number = 20;
    queryTabId: string;

    state: ITypeState = {
        rows: [],
        page: 1,
        total: 0,
        sort: [],
        delete: false,
        error: null,
        search: '',
        loading: false,
    };

    requestData = () => {
        const checkId = this.state.search.length ? /^\d+$/.test(this.state.search) : false;

        let query: string = 'MATCH (a)-[' + (this.props.type.startsWith('*') ? 'r' : 'r:' + this.props.type) + ']->(b)';
        if (this.state.search.length) {
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
                search: this.state.search,
                id: checkId ? db.toInt(this.state.search) : null,
            },
            this.props.database
        )
            .then(response1 => {
                const cnt: number = db.fromInt(response1.records[0].get('cnt'));
                const page: number = Math.min(this.state.page, Math.ceil(cnt / this.perPage));

                db.query(
                    query +
                        ' RETURN r ' +
                        (this.state.sort.length ? 'ORDER BY ' + this.state.sort.join(', ') : '') +
                        ' SKIP $skip LIMIT $limit',
                    {
                        skip: db.toInt(Math.max(page - 1, 0) * this.perPage),
                        limit: db.toInt(this.perPage),
                        search: this.state.search,
                        id: checkId ? db.toInt(this.state.search) : null,
                    },
                    this.props.database
                )
                    .then(response2 => {
                        this.setState({
                            rows: response2.records.map(record => record.get('r')),
                            total: cnt,
                            page: Math.max(page, 1),
                            loading: false,
                        });
                    })
                    .catch(err =>
                        this.setState({
                            error: '[' + err.name + '] ' + err.message,
                            loading: false,
                        })
                    );
            })
            .catch(err =>
                this.setState({
                    error: '[' + err.name + '] ' + err.message,
                    loading: false,
                })
            );
    };

    componentDidMount() {
        this.requestData();
    }

    componentDidUpdate(prevProps: Readonly<IPageProps>) {
        if (prevProps.active !== this.props.active && this.props.active) this.requestData();
    }

    handleChangePage = (page: number) => {
        this.setState(
            {
                page: page,
            },
            this.requestData
        );
    };

    handleClearError = () => {
        this.setState({
            error: null,
        });
    };

    handleDeleteModalConfirm = (id: number | string) => {
        db.query(
            'MATCH ()-[r]-() WHERE ' + db.fnId('r') + ' = $id DELETE r',
            {
                id: id,
            },
            this.props.database
        )
            .then(response => {
                if (response.summary.counters.updates().nodesDeleted > 0) {
                    this.requestData();
                    this.props.tabManager.close(this.props.tabId);
                    this.props.toast('Relationship deleted');
                }
            })
            .catch(error => {
                this.setState({
                    error: error.message,
                });
            });
    };

    handleSetSort = (value: string) => {
        this.setState(state => {
            const i = state.sort.indexOf(value),
                j = state.sort.indexOf(value + ' DESC');
            const copy = [...state.sort];

            if (i !== -1) {
                copy[i] = value + ' DESC';
            } else if (j !== -1) {
                copy.splice(i, 1);
            } else {
                copy.push(value);
            }

            return {
                sort: copy,
            };
        }, this.requestData);
    };

    timeout: NodeJS.Timeout = null;

    handleSearch = (str: string = ''): void => {
        this.setState(
            {
                search: str,
                loading: true,
            },
            () => {
                if (this.timeout !== null) clearTimeout(this.timeout);
                this.timeout = setTimeout(() => {
                    this.requestData();
                    this.timeout = null;
                }, 300);
            }
        );
    };

    render() {
        const keys = [];
        for (const row of this.state.rows) {
            for (const k in row.properties) {
                if (!keys.includes(k)) {
                    keys.push(k);
                }
            }
        }
        //add sorted keys which are not available in visible rows
        for (let s of this.state.sort) {
            s = s.replace(/^r\.([^ ]+)(?: DESC)?$/, '$1');
            if (!keys.includes(s)) keys.push(s);
        }
        keys.sort();

        let printQuery: string =
            'MATCH (a)-[' + (this.props.type.startsWith('*') ? 'r' : 'r:' + this.props.type) + ']->(b)';
        if (this.state.search.length) {
            switch (db.ecosystem) {
                case Ecosystem.Neo4j:
                    printQuery +=
                        ' WHERE any(prop IN keys(r) WHERE toStringOrNull(r[prop]) STARTS WITH "' +
                        this.state.search +
                        '")';
                    break;
                case Ecosystem.Memgraph:
                    printQuery +=
                        ' WHERE any(prop IN keys(r) WHERE NOT valueType(r[prop]) IN ["LIST", "MAP"] AND toString(r[prop]) STARTS WITH "' +
                        this.state.search +
                        '")';
                    break;
                default:
                    return;
            }
            if (/^\d+$/.test(this.state.search))
                printQuery +=
                    ' OR id(r) = ' +
                    this.state.search +
                    ' OR id(a) = ' +
                    this.state.search +
                    ' OR id(b) = ' +
                    this.state.search;
        }
        printQuery +=
            ' RETURN n' +
            (this.state.sort.length ? ' ORDER BY ' + this.state.sort.join(', ') : '') +
            ' SKIP ' +
            Math.max(this.state.page - 1, 0) * this.perPage +
            ' LIMIT ' +
            this.perPage;

        return (
            <>
                {this.state.delete && (
                    <DeleteModal
                        delete={this.state.delete}
                        handleConfirm={this.handleDeleteModalConfirm}
                        handleClose={() => this.setState({ delete: false })}
                    />
                )}

                {typeof this.state.error === 'string' && (
                    <div className='message is-danger'>
                        <div className='message-header'>
                            <p>Error</p>
                            <button className='delete' aria-label='delete' onClick={this.handleClearError} />
                        </div>
                        <div className='message-body'>{this.state.error}</div>
                    </div>
                )}

                <div className='mb-3' style={{ overflowY: 'auto' }}>
                    <span className='icon-text is-flex-wrap-nowrap'>
                        <span className='icon'>
                            <i className='fa-solid fa-terminal' aria-hidden='true' />
                        </span>
                        <ClipboardContext.Consumer>
                            {copy => (
                                <span className='is-family-code is-pre-wrap is-copyable' onClick={copy}>
                                    {printQuery}
                                </span>
                            )}
                        </ClipboardContext.Consumer>
                    </span>
                </div>

                <div className='buttons mb-3'>
                    <Button
                        icon='fa-solid fa-plus'
                        text='Create relationship'
                        color='is-primary'
                        onClick={() =>
                            this.props.tabManager.add(
                                { prefix: 'New relationship' },
                                'fa-regular fa-square-plus',
                                EPage.Rel,
                                {
                                    id: null,
                                    database: this.props.database,
                                    type: this.props.type.startsWith('*') ? '' : this.props.type,
                                }
                            )
                        }
                    />
                    <Button
                        icon='fa-solid fa-circle-nodes'
                        text='View as graph'
                        onClick={() =>
                            (this.queryTabId = this.props.tabManager.add(
                                { prefix: 'Query' },
                                'fa-solid fa-terminal',
                                EPage.Query,
                                {
                                    query: printQuery,
                                    execute: true,
                                    view: EQueryView.Graph,
                                },
                                this.queryTabId
                            ))
                        }
                    />
                    <div
                        className={
                            'control has-icons-left is-align-self-flex-start ' +
                            (this.state.loading ? 'border-progress' : '')
                        }
                    >
                        <input
                            className='input'
                            type='search'
                            placeholder='Search'
                            value={this.state.search}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                this.handleSearch(e.currentTarget.value)
                            }
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
                                <th colSpan={settings().tableViewShowElementId && db.hasElementId ? 3 : 2}>
                                    Relationship
                                </th>
                                {this.props.type.startsWith('*') && <th rowSpan={2}>Type</th>}
                                {keys.length > 0 ? <th colSpan={keys.length}>properties</th> : ''}
                                <th colSpan={settings().tableViewShowElementId && db.hasElementId ? 2 : 1}>
                                    Start node
                                </th>
                                <th colSpan={settings().tableViewShowElementId && db.hasElementId ? 2 : 1}>End node</th>
                            </tr>
                            <tr>
                                <th
                                    rowSpan={2}
                                    className='wspace-nowrap is-clickable'
                                    onClick={() => this.handleSetSort('id(r)')}
                                >
                                    id <TableSortIcon sort='id(r)' current={this.state.sort} />
                                </th>
                                {settings().tableViewShowElementId && db.hasElementId && (
                                    <th
                                        rowSpan={2}
                                        className='wspace-nowrap is-clickable'
                                        onClick={() => this.handleSetSort('elementId(r)')}
                                    >
                                        elementId <TableSortIcon sort='elementId(r)' current={this.state.sort} />
                                    </th>
                                )}
                                <th></th>
                                {keys.map(key => (
                                    <th
                                        key={'th-' + key}
                                        className='wspace-nowrap is-clickable'
                                        onClick={() => this.handleSetSort('r.' + key)}
                                    >
                                        {key} <TableSortIcon sort={'r.' + key} current={this.state.sort} />
                                    </th>
                                ))}

                                <th className='wspace-nowrap is-clickable' onClick={() => this.handleSetSort('id(a)')}>
                                    id <TableSortIcon sort={'id(a)'} current={this.state.sort} />
                                </th>
                                {settings().tableViewShowElementId && db.hasElementId && (
                                    <th
                                        className='wspace-nowrap is-clickable'
                                        onClick={() => this.handleSetSort('elementId(a)')}
                                    >
                                        elementId <TableSortIcon sort={'elementId(a)'} current={this.state.sort} />
                                    </th>
                                )}
                                <th className='wspace-nowrap is-clickable' onClick={() => this.handleSetSort('id(b)')}>
                                    id <TableSortIcon sort={'id(b)'} current={this.state.sort} />
                                </th>
                                {settings().tableViewShowElementId && db.hasElementId && (
                                    <th
                                        className='wspace-nowrap is-clickable'
                                        onClick={() => this.handleSetSort('elementId(b)')}
                                    >
                                        elementId <TableSortIcon sort={'elementId(b)'} current={this.state.sort} />
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {this.state.rows.map(row => (
                                <tr key={'tr-' + db.strInt(row.identity)}>
                                    <td>
                                        <Button
                                            onClick={() =>
                                                this.props.tabManager.add(
                                                    {
                                                        prefix: 'Rel',
                                                        i: row.identity,
                                                    },
                                                    'fa-regular fa-pen-to-square',
                                                    EPage.Rel,
                                                    {
                                                        id: db.getId(row),
                                                        database: this.props.database,
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
                                            {this.props.stashManager.button(row, this.props.database)}
                                            <Button
                                                icon='fa-regular fa-trash-can'
                                                color='is-danger is-outlined'
                                                title='Delete'
                                                onClick={() =>
                                                    this.setState({
                                                        delete: db.getId(row),
                                                    })
                                                }
                                            />
                                        </div>
                                    </td>
                                    {this.props.type.startsWith('*') && (
                                        <td>
                                            <TypeButton
                                                type={row.type}
                                                database={this.props.database}
                                                tabManager={this.props.tabManager}
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
                                                this.props.tabManager.add(
                                                    {
                                                        prefix: 'Node',
                                                        i: row.start,
                                                    },
                                                    'fa-solid fa-pen-to-square',
                                                    EPage.Node,
                                                    {
                                                        id: db.getId(row, 'startNodeElementId', 'start'),
                                                        database: this.props.database,
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
                                                this.props.tabManager.add(
                                                    {
                                                        prefix: 'Node',
                                                        i: row.end,
                                                    },
                                                    'fa-solid fa-pen-to-square',
                                                    EPage.Node,
                                                    {
                                                        id: db.getId(row, 'endNodeElementId', 'end'),
                                                        database: this.props.database,
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

                <Pagination
                    page={this.state.page}
                    pages={Math.ceil(this.state.total / this.perPage)}
                    action={this.handleChangePage}
                />
            </>
        );
    }
}

export default Type;
