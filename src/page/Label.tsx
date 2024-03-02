import * as React from "react";
import Pagination from "../components/Pagination";
import TableSortIcon from "../components/TableSortIcon";
import { Button, Checkbox, LabelButton } from "../components/form";
import { Node as _Node } from "neo4j-driver";
import { Ecosystem, EPage, EQueryView } from "../utils/enums";
import { IPageProps } from "../utils/interfaces";
import db from "../db";
import { DeleteModal } from "../components/Modal";
import { settings } from "../layout/Settings";
import { ClipboardContext } from "../utils/contexts";

interface ILabelProps extends IPageProps {
    database: string;
    label: string;
}

interface ILabelState {
    rows: _Node[];
    page: number;
    total: number;
    sort: string[];
    delete: number | string | false;
    error: string | null;
    search: string;
    loading: boolean;
}

/**
 * List all nodes with specific label
 */
class Label extends React.Component<ILabelProps, ILabelState> {
    perPage: number = 20;
    queryTabId: string;

    state: ILabelState = {
        rows: [],
        page: 1,
        total: 0,
        sort: [],
        delete: false,
        error: null,
        search: "",
        loading: false,
    };

    requestData = () => {
        const checkId = this.state.search.length ? /^\d+$/.test(this.state.search) : false;

        let query: string = "MATCH (" + (this.props.label.startsWith("*") ? "n" : "n:" + this.props.label) + ")";
        if (this.state.search.length) {
            switch (db.ecosystem) {
                case Ecosystem.Neo4j:
                    query += " WHERE any(prop IN keys(n) WHERE toStringOrNull(n[prop]) STARTS WITH $search)";
                    break;
                case Ecosystem.Memgraph:
                    query += ' WHERE any(prop IN keys(n) WHERE NOT valueType(n[prop]) IN ["LIST", "MAP"] AND toString(n[prop]) STARTS WITH $search)';
                    break;
                default:
                    return;
            }
            if (checkId) query += " OR id(n) = $id";
        }

        db.query(
            query + " RETURN COUNT(n) AS cnt",
            {
                search: this.state.search,
                id: checkId ? db.toInt(this.state.search) : null,
            },
            this.props.database
        )
            .then(response1 => {
                const cnt: number = db.fromInt(response1.records[0].get("cnt"));
                const page: number = Math.min(this.state.page, Math.ceil(cnt / this.perPage));

                db.query(
                    query + " RETURN n " + (this.state.sort.length ? "ORDER BY " + this.state.sort.join(", ") : "") + " SKIP $skip LIMIT $limit",
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
                            rows: response2.records.map(record => record.get("n")),
                            total: cnt,
                            page: page,
                            loading: false,
                        });
                    })
                    .catch(err =>
                        this.setState({
                            error: "[" + err.name + "] " + err.message,
                            loading: false,
                        })
                    );
            })
            .catch(err =>
                this.setState({
                    error: "[" + err.name + "] " + err.message,
                    loading: false,
                })
            );
    };

    componentDidMount() {
        this.requestData();
    }

    componentDidUpdate(prevProps: Readonly<ILabelProps>) {
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

    handleDeleteModalConfirm = (id: number | string, detach: boolean) => {
        db.query(
            "MATCH (n) WHERE " + db.fnId() + " = $id " + (detach ? "DETACH " : "") + "DELETE n",
            {
                id: id,
            },
            this.props.database
        )
            .then(response => {
                if (response.summary.counters.updates().nodesDeleted > 0) {
                    this.requestData();
                    this.props.tabManager.close(id + this.props.database);
                    this.props.toast("Node deleted");
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
            let i = state.sort.indexOf(value),
                j = state.sort.indexOf(value + " DESC");
            let copy = [...state.sort];

            if (i !== -1) {
                copy[i] = value + " DESC";
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

    handleSearch = (str: string = ""): void => {
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
        let keys = [];
        for (let row of this.state.rows) {
            for (let k in row.properties) {
                if (!keys.includes(k)) {
                    keys.push(k);
                }
            }
        }
        //add sorted keys which are not available in visible rows
        for (let s of this.state.sort) {
            s = s.replace(/^n\.([^ ]+)(?: DESC)?$/, "$1");
            if (!keys.includes(s)) keys.push(s);
        }
        keys.sort();

        const additionalLabels = (() => {
            for (let row of this.state.rows) {
                for (let label of row.labels) {
                    if (label !== this.props.label) {
                        return true;
                    }
                }
            }
            return false;
        })();

        let printQuery: string = "MATCH (" + (this.props.label.startsWith("*") ? "n" : "n:" + this.props.label) + ")";
        if (this.state.search.length) {
            switch (db.ecosystem) {
                case Ecosystem.Neo4j:
                    printQuery += ' WHERE any(prop IN keys(n) WHERE toStringOrNull(n[prop]) STARTS WITH "' + this.state.search + '")';
                    break;
                case Ecosystem.Memgraph:
                    printQuery += ' WHERE any(prop IN keys(n) WHERE NOT valueType(n[prop]) IN ["LIST", "MAP"] AND toString(n[prop]) STARTS WITH "' + this.state.search + '")';
                    break;
                default:
                    return;
            }
            if (/^\d+$/.test(this.state.search)) printQuery += " OR id(n) = " + this.state.search;
        }
        printQuery += " RETURN n" + (this.state.sort.length ? " ORDER BY " + this.state.sort.join(", ") : "") + " SKIP " + Math.max(this.state.page - 1, 0) * this.perPage + " LIMIT " + this.perPage;

        return (
            <>
                {this.state.delete && <DeleteModal delete={this.state.delete} detach handleConfirm={this.handleDeleteModalConfirm} handleClose={() => this.setState({ delete: false })} />}

                {this.state.error && (
                    <div className="message is-danger">
                        <div className="message-header">
                            <p>Error</p>
                            <button className="delete" aria-label="delete" onClick={() => this.setState({ error: null })} />
                        </div>
                        <div className="message-body">{this.state.error}</div>
                    </div>
                )}

                <div className="mb-3" style={{ overflowY: "auto" }}>
                    <span className="icon-text is-flex-wrap-nowrap">
                        <span className="icon">
                            <i className="fa-solid fa-terminal" aria-hidden="true" />
                        </span>
                        <ClipboardContext.Consumer>
                            {copy => (
                                <span className="is-family-code is-pre-wrap is-copyable" onClick={copy}>
                                    {printQuery}
                                </span>
                            )}
                        </ClipboardContext.Consumer>
                    </span>
                </div>

                <div className="buttons mb-1">
                    <Button
                        icon="fa-solid fa-plus"
                        text="Create node"
                        color="is-primary"
                        onClick={() =>
                            this.props.tabManager.add(
                                { prefix: "New node" },
                                "fa-solid fa-square-plus",
                                EPage.Node,
                                {
                                    id: null,
                                    database: this.props.database,
                                    label: this.props.label === "*" ? "" : this.props.label,
                                },
                                new Date().getTime().toString()
                            )
                        }
                    />
                    <Button
                        icon=""
                        text="View as graph"
                        onClick={() =>
                            (this.queryTabId = this.props.tabManager.add(
                                { prefix: "Query" },
                                "fa-solid fa-terminal",
                                EPage.Query,
                                { query: printQuery, execute: true, view: EQueryView.Graph },
                                this.queryTabId
                            ))
                        }
                    />
                    <div className={"control has-icons-left has-icons-right is-align-self-flex-start " + (this.state.loading ? "border-progress" : "")}>
                        <input
                            className="input"
                            type="text"
                            placeholder="Search"
                            value={this.state.search}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => this.handleSearch(e.currentTarget.value)}
                        />
                        <span className="icon is-left">
                            <i className="fas fa-search" aria-hidden="true" />
                        </span>
                        <span className="icon is-right is-clickable" onClick={() => this.handleSearch()}>
                            <i className="fa-solid fa-xmark" />
                        </span>
                    </div>
                </div>

                <div className="table-container">
                    <table className="table is-bordered is-striped is-narrow is-hoverable">
                        <thead>
                            <tr>
                                <th colSpan={settings().tableViewShowElementId && db.hasElementId ? 3 : 2}>Node</th>
                                {additionalLabels && <th rowSpan={2}>Additional labels</th>}
                                {keys.length > 0 ? <th colSpan={keys.length}>properties</th> : ""}
                            </tr>
                            <tr>
                                <th className="wspace-nowrap is-clickable" onClick={() => this.handleSetSort("id(n)")}>
                                    id <TableSortIcon sort="id(n)" current={this.state.sort} />
                                </th>
                                {settings().tableViewShowElementId && db.hasElementId && (
                                    <th className="wspace-nowrap is-clickable" onClick={() => this.handleSetSort("elementId(n)")}>
                                        elementId <TableSortIcon sort="elementId(n)" current={this.state.sort} />
                                    </th>
                                )}
                                <th></th>
                                {keys.map(key => (
                                    <th key={"th-" + key} className="wspace-nowrap is-clickable" onClick={() => this.handleSetSort("n." + key)}>
                                        {key} <TableSortIcon sort={"n." + key} current={this.state.sort} />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {this.state.rows.map(row => (
                                <tr key={"tr-" + db.strInt(row.identity)}>
                                    <td>
                                        <Button
                                            onClick={() =>
                                                this.props.tabManager.add({ prefix: "Node", i: row.identity }, "fa-solid fa-pen-to-square", EPage.Node, {
                                                    id: db.getId(row),
                                                    database: this.props.database,
                                                })
                                            }
                                            icon="fa-solid fa-pen-clip"
                                            text={"#" + db.strInt(row.identity)}
                                        />
                                    </td>
                                    {settings().tableViewShowElementId && db.hasElementId && <td className="wspace-nowrap">{row.elementId}</td>}
                                    <td>
                                        <div className="buttons is-flex-wrap-nowrap">
                                            {this.props.stashManager.button(row, this.props.database)}
                                            <Button icon="fa-regular fa-trash-can" color="is-danger is-outlined" title="Delete" onClick={() => this.setState({ delete: db.getId(row) })} />
                                        </div>
                                    </td>
                                    {additionalLabels && (
                                        <td>
                                            <span className="buttons">
                                                {row.labels
                                                    .filter(value => value !== this.props.label)
                                                    .map(label => (
                                                        <LabelButton key={label} label={label} database={this.props.database} tabManager={this.props.tabManager} />
                                                    ))}
                                            </span>
                                        </td>
                                    )}
                                    {keys.map(key => (
                                        <td key={"td-" + key}>{key in row.properties && this.printProperty(row.properties[key])}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pagination page={this.state.page} pages={Math.ceil(this.state.total / this.perPage)} action={this.handleChangePage} />
            </>
        );
    }

    printProperty = (property: any): string | React.ReactElement => {
        if (db.isInt(property)) return db.strInt(property);
        if (Array.isArray(property)) return "[" + property.join(", ") + "]";
        if (typeof property === "boolean") return <Checkbox name="" label="" checked={property} disabled />;
        return property.toString();
    };
}

export default Label;
