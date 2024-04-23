import * as React from "react";
import { Button, Textarea } from "../components/form";
import { IPageProps } from "../utils/interfaces";
import db from "../db";
import { ClipboardContext } from "../utils/contexts";
import {
    Node as _Node,
    Path as _Path,
    Record,
    Relationship as _Relationship,
    ResultSummary,
} from "neo4j-driver";
import { Ecosystem, EPage, EQueryView } from "../utils/enums";
import { t_StashQuery } from "../utils/types";
import Table from "./query/Table";
import Summary from "./query/Summary";
import Json from "./query/Json";
import Graph from "./query/Graph";

interface IQueryProps extends IPageProps {
    query?: string;
    view?: EQueryView;
    execute?: boolean;
}

interface IQueryState {
    view: EQueryView;
    tableSize: number;
    query: string;
    rows: Record[];
    summary: ResultSummary | null;
    error: string | null;
    loading: boolean;
    keys: string[];
}

/**
 * Execute custom query
 */
class Query extends React.Component<IQueryProps, IQueryState> {
    state: IQueryState = {
        view: this.props.view || EQueryView.Table,
        tableSize: parseInt(localStorage.getItem("query.tableSize") || "2"),
        query: this.props.query || "",
        rows: [],
        summary: null,
        error: null,
        loading: false,
        keys: []
    };

    showTableSize = false;

    componentDidMount() {
        if (this.props.execute) this.handleSubmit(null);
    }

    setShowTableSize = (value: any) => {
        if (Array.isArray(value)) {
            value.forEach(this.setShowTableSize);
        } else if (value !== null && typeof value === "object") {
            if (value instanceof _Node || value instanceof _Relationship || value instanceof _Path) this.showTableSize = true;
            else this.setShowTableSize(Object.values(value));
        }
    };

    handleSubmit = (e: React.FormEvent) => {
        if (!!e) e.preventDefault();
        this.showTableSize = false;
        this.setState(
            {
                loading: true,
                rows: [],
                summary: null
            },
            () => {
                db.query(this.state.query, {}, db.database)
                    .then(response => {
                        //check create/delete database
                        if (/\s*(CREATE|DROP)\s+(COMPOSITE\s+)?DATABASE/i.test(this.state.query)) {
                            db.query("SHOW DATABASES")
                                .then(response => {
                                    db.databases = response.records
                                        .filter(row => !row.has("type") || row.get("type") !== "system")
                                        .map(row => db.ecosystem === Ecosystem.Memgraph ? row.get("Name") : row.get("name"));
                                })
                                .catch(() => {
                                });
                        }

                        const keys: Set<string> = new Set();
                        response.records.forEach(r => r.keys.forEach(keys.add, keys));

                        this.setShowTableSize(response.records);
                        this.setState(
                            state => {
                                return {
                                    summary: response.summary,
                                    rows: response.records,
                                    error: null,
                                    loading: false,
                                    view: response.records.length === 0 ? EQueryView.Summary : state.view,
                                    keys: Array.from(keys)
                                };
                            }
                        );
                    })
                    .catch(err => {
                        this.setState({
                            rows: [],
                            summary: null,
                            error: "[" + err.name + "] " + err.message,
                            loading: false,
                        });
                    });
            }
        );
    };

    changeView = (i: EQueryView) => {
        this.setState({
            view: i,
        });
    };

    setTableSize = (i: number) => {
        this.setState({
            tableSize: i,
        });
        localStorage.setItem("query.tableSize", i.toString());
    };

    render() {
        return (
            <>
                <form onSubmit={this.handleSubmit} className="block">
                    <div className="field">
                        <div className="control has-icons-right has-icons-left">
                            <Textarea
                                required
                                name="query"
                                value={this.state.query}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                    this.setState({ query: e.currentTarget.value });
                                    this.props.tabManager.add(this.props.tabName, "fa-solid fa-terminal", EPage.Query, { query: e.currentTarget.value }, this.props.tabId);
                                }}
                                color="is-family-code is-pre-wrap"
                                focus={true}
                                onKeyDown={(e: React.KeyboardEvent) => {
                                    if (e.key === "Enter" && e.ctrlKey) this.handleSubmit(null);
                                }}
                                highlight={{
                                    mark: ["CALL", "CREATE", "DELETE", "DETACH", "FOREACH", "LOAD", "MATCH", "MERGE", "OPTIONAL", "REMOVE", "RETURN", "SET", "START", "UNION", "UNWIND", "WITH"],
                                    "#995800": ["LIMIT", "ORDER", "SKIP", "WHERE", "YIELD"],
                                    "#c07817": ["ASC", "ASCENDING", "ASSERT", "BY", "CSV", "DESC", "DESCENDING", "ON"],
                                    "#1732c0": ["ALL", "CASE", "COUNT", "ELSE", "END", "EXISTS", "THEN", "WHEN"],
                                    "#1683b3": ["AND", "AS", "CONTAINS", "DISTINCT", "ENDS", "IN", "IS", "NOT", "OR", "STARTS", "XOR"],
                                    "#a00726": ["CONSTRAINT", "CREATE", "DROP", "EXISTS", "INDEX", "NODE", "KEY", "UNIQUE"],
                                    "#ba1919": ["INDEX", "JOIN", "SCAN", "USING"],
                                    "#0f00b4": ["false", "null", "true"],
                                }}
                            />
                            <span className="icon is-left">
                                <i className="fa-solid fa-terminal" aria-hidden="true" />
                            </span>
                            <ClipboardContext.Consumer>
                                {copy => (
                                    <span className="icon is-right is-clickable" onClick={copy}>
                                        <i className="fa-regular fa-copy" />
                                    </span>
                                )}
                            </ClipboardContext.Consumer>
                        </div>
                    </div>
                    <div className="field">
                        <div className="buttons is-justify-content-flex-end">
                            <Button color={"is-success " + (this.state.loading ? "is-loading" : "")} type="submit" icon="fa-solid fa-check" text="Execute" />
                            <a href={db.ecosystem === Ecosystem.Memgraph ? 'https://memgraph.com/docs/querying' : 'https://neo4j.com/docs/cypher-manual/'} target="_blank" className="button" title="Cypher documentation">
                                <span className="icon">
                                    <i className="fa-solid fa-book" />
                                </span>
                            </a>
                            {this.props.stashManager.button(new t_StashQuery(this.props.tabId, this.state.query), "")}
                            <Button icon="fa-solid fa-xmark" text="Close" onClick={e => this.props.tabManager.close(this.props.tabId, e)} />
                        </div>
                    </div>
                </form>

                {typeof this.state.error === "string" && (
                    <div className="message is-danger block">
                        <div className="message-header">
                            <p>Error</p>
                            <button
                                className="delete"
                                aria-label="delete"
                                onClick={() =>
                                    this.setState({
                                        error: null,
                                    })
                                }
                            />
                        </div>
                        <div className="message-body">{this.state.error}</div>
                    </div>
                )}

                <div className="block">
                    <div className="buttons has-addons">
                        <span>
                            <Button
                                text="Table"
                                color={this.state.view === EQueryView.Table ? "is-link is-light is-active" : ""}
                                icon="fa-solid fa-table"
                                onClick={() => this.changeView(EQueryView.Table)}
                            />
                            <Button
                                text="JSON"
                                color={this.state.view === EQueryView.JSON ? "is-link is-light is-active" : ""}
                                icon="fa-brands fa-js"
                                onClick={() => this.changeView(EQueryView.JSON)}
                            />
                            <Button
                                text="Graph"
                                color={this.state.view === EQueryView.Graph ? "is-link is-light is-active" : ""}
                                icon="fa-solid fa-circle-nodes"
                                onClick={() => this.changeView(EQueryView.Graph)}
                            />
                            <Button
                                text="Summary"
                                color={this.state.view === EQueryView.Summary ? "is-link is-light is-active" : ""}
                                icon="fa-solid fa-gauge-high"
                                onClick={() => this.changeView(EQueryView.Summary)}
                            />
                        </span>
                        {this.state.view === EQueryView.Table && this.showTableSize && (
                            <span className="ml-3">
                                <Button color={this.state.tableSize === 1 ? "is-link is-light is-active" : ""} icon="fa-solid fa-arrows-up-down is-size-7" onClick={() => this.setTableSize(1)}>
                                    <span className="is-size-7">Small</span>
                                </Button>
                                <Button text="Medium" color={this.state.tableSize === 2 ? "is-link is-light is-active" : ""} icon="fa-solid fa-arrows-up-down" onClick={() => this.setTableSize(2)} />
                            </span>
                        )}
                    </div>
                </div>

                {this.state.view === EQueryView.Table && this.state.rows.length && <Table
                    keys={this.state.keys}
                    rows={this.state.rows}
                    tableSize={this.state.tableSize}
                    tabManager={this.props.tabManager} />}

                {this.state.view === EQueryView.Graph && this.state.rows.length && <Graph
                    rows={this.state.rows}
                    tabManager={this.props.tabManager} />}

                {this.state.view === EQueryView.JSON && this.state.rows.length && <Json rows={this.state.rows} />}

                {this.state.view === EQueryView.Summary && this.state.summary && <Summary summary={this.state.summary} />}

                {this.state.rows.length === 0 && !this.state.summary && <div className="block">No result</div>}
            </>
        );
    }
}

export default Query;
