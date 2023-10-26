import * as React from "react";
import { Button, Textarea } from "../components/form";
import { IPageProps } from "../utils/interfaces";
import db from "../db";
import { ClipboardContext } from "../utils/contexts";
import {
    Date as _Date,
    DateTime as _DateTime,
    Duration as _Duration,
    LocalDateTime as _LocalDateTime,
    LocalTime as _LocalTime,
    Node as _Node,
    Path as _Path,
    Record,
    Relationship as _Relationship,
    ResultSummary,
    Time as _Time,
} from "neo4j-driver";
import { EPage, EQueryView } from "../utils/enums";
import { settings } from "../layout/Settings";
import { Orb, OrbEventType } from "@memgraph/orb";
import InlineNode from "../components/InlineNode";
import InlineRelationship from "../components/InlineRelationship";
import { durationToString, toJSON } from "../utils/fn";
import orb_logo from "../assets/orb_logo.png";
import { t_StashQuery } from "../utils/types";

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
    summary: ResultSummary;
    error: string | null;
    loading: boolean;
}

interface MyNode {
    id: string;
    label: string;
    identity: number | string;
}

interface MyEdge {
    id: string;
    label: string;
    start: any;
    end: any;
    identity: number | string;
}

/**
 * Execute custom query
 * todo improve graph view (not yet defined how)
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
    };

    showTableSize = false;
    graphElement = React.createRef<HTMLDivElement>();
    orb: Orb;

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
            },
            () => {
                db.query(this.state.query, {}, db.database)
                    .then(response => {
                        //check create/delete database
                        if (/\s*CREATE\s+(COMPOSITE\s+)?DATABASE/i.test(this.state.query) || /\s*DROP\s+(COMPOSITE\s+)?DATABASE/i.test(this.state.query)) {
                            db.query("SHOW DATABASES")
                                .then(response => {
                                    db.databases = response.records.filter(row => row.get("type") !== "system").map(row => row.get("name"));
                                })
                                .catch(() => {});
                        }

                        this.setShowTableSize(response.records);
                        this.setState(
                            state => {
                                return {
                                    summary: response.summary,
                                    rows: response.records,
                                    error: null,
                                    loading: false,
                                    view: response.records.length === 0 ? EQueryView.Summary : state.view,
                                };
                            },
                            () => {
                                if (this.state.view === EQueryView.Graph) this.initGraphView();
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

    initGraphView = () => {
        const current = this.graphElement.current;
        if (!current) return;

        if (!this.orb) {
            this.orb = new Orb<MyNode, MyEdge>(current);

            this.orb.events.on(OrbEventType.NODE_CLICK, event => {
                this.props.tabManager.add({ prefix: "Node", i: event.node.id }, "fa-solid fa-pen-to-square", EPage.Node, {
                    id: event.node.data.identity,
                    database: db.database,
                });
            });

            this.orb.events.on(OrbEventType.EDGE_CLICK, event => {
                this.props.tabManager.add({ prefix: "Rel", i: event.edge.id }, "fa-regular fa-pen-to-square", EPage.Rel, {
                    id: event.edge.data.identity,
                    database: db.database,
                });
            });
        }

        let nodes: MyNode[] = [];
        let edges: MyEdge[] = [];
        this.state.rows.forEach(row => {
            for (let key of row.keys) {
                const value = row.get(key);
                if (value instanceof _Node) nodes.push({ id: db.strInt(value.identity), label: ":" + value.labels.join(":"), identity: db.getId(value) });
                else if (value instanceof _Relationship)
                    edges.push({
                        id: db.strInt(value.identity),
                        start: db.strInt(value.start),
                        end: db.strInt(value.end),
                        label: ":" + value.type,
                        identity: db.getId(value),
                    });
            }
        });

        this.orb.data.setup({ nodes, edges });
        this.orb.view.render(() => {
            this.orb.view.recenter();
        });
    };

    changeView = (i: EQueryView) => {
        this.setState(
            {
                view: i,
            },
            () => {
                if (this.state.view === EQueryView.Graph) this.initGraphView();
            }
        );
    };

    setTableSize = (i: number) => {
        this.setState({
            tableSize: i,
        });
        localStorage.setItem("query.tableSize", i.toString());
    };

    render() {
        let keys = [];
        this.state.rows.forEach(row => {
            for (let key of row.keys) if (!keys.includes(key)) keys.push(key);
        });

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

                <div className={"block " + (this.state.view === EQueryView.Table && this.state.rows.length ? "" : "is-hidden")}>
                    <div className="table-container">
                        <table className="table is-bordered is-striped is-narrow is-hoverable">
                            <thead>
                                <tr>
                                    {keys.map(key => (
                                        <th key={key}>{key}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {this.state.rows.map((row, i) => (
                                    <tr key={i}>
                                        {keys.map(key => (
                                            <td key={key}>{row.has(key) ? this.printValue(row.get(key)) : ""}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={"block " + (this.state.view === EQueryView.Graph && this.state.rows.length ? "" : "is-hidden")}>
                    <div className="graph" ref={this.graphElement}>
                        <div className="buttons">
                            {document.fullscreenEnabled && (
                                <Button
                                    icon={"fa-solid " + (document.fullscreenElement === null ? "fa-expand" : "fa-compress")}
                                    color="mr-0"
                                    onClick={() => {
                                        if (document.fullscreenElement === null) {
                                            this.graphElement.current.requestFullscreen().then(() => {
                                                setTimeout(() => this.orb.view.recenter(), 100);
                                                this.setState({});
                                            });
                                        } else {
                                            document.exitFullscreen().then(() => {
                                                setTimeout(() => this.orb.view.recenter(), 100);
                                                this.setState({});
                                            });
                                        }
                                    }}
                                    title="Fullscreen"
                                />
                            )}
                            <Button icon="fa-solid fa-maximize" onClick={() => this.orb.view.recenter()} color="mr-0" title="Recenter" />
                        </div>
                        <div className="brand is-flex is-align-items-center">
                            <span className="is-size-7">Powered by</span>
                            <a href="https://github.com/memgraph/orb" target="_blank" className="ml-1">
                                <img src={orb_logo} alt="ORB" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className={"block " + (this.state.view === EQueryView.JSON && this.state.rows.length ? "" : "is-hidden")}>
                    <div className="control has-icons-right">
                        <pre>{toJSON(this.state.rows)}</pre>
                        <ClipboardContext.Consumer>
                            {copy => (
                                <span className="icon is-right is-clickable" onClick={copy}>
                                    <i className="fa-regular fa-copy" />
                                </span>
                            )}
                        </ClipboardContext.Consumer>
                    </div>
                </div>

                <div className={"block " + (this.state.view === EQueryView.Summary && this.state.summary ? "" : "is-hidden")}>
                    <div className="control has-icons-right">
                        <pre>{toJSON(this.state.summary)}</pre>
                        <ClipboardContext.Consumer>
                            {copy => (
                                <span className="icon is-right is-clickable" onClick={copy}>
                                    <i className="fa-regular fa-copy" />
                                </span>
                            )}
                        </ClipboardContext.Consumer>
                    </div>
                </div>

                {this.state.rows.length === 0 && !this.state.summary && <div className="block">No result</div>}
            </>
        );
    }

    printValue = (value: any): React.ReactElement => {
        if (db.isInt(value)) return <>{db.strInt(value)}</>;
        if (Array.isArray(value)) return <>[{value.map<React.ReactNode>(entry => this.printValue(entry)).reduce((prev, curr) => [prev, ", ", curr])}]</>;
        if (value === null) return <p className="has-text-grey">null</p>;
        if (typeof value === "boolean") return <>{value ? "true" : "false"}</>;
        if (typeof value === "string") return <p className="wspace-pre is-inline-block">{value}</p>;

        if (value instanceof _Node) {
            return <InlineNode node={value} tabManager={this.props.tabManager} small={this.state.tableSize === 1} />;
        }
        if (value instanceof _Relationship) {
            return <InlineRelationship rel={value} tabManager={this.props.tabManager} small={this.state.tableSize === 1} />;
        }
        if (value instanceof _Path) {
            let start = value.start;
            let first = true;
            return (
                <div className="is-flex is-align-items-center">
                    {value.segments.map(segment => {
                        const r = (
                            <>
                                {first && (
                                    <>
                                        <span className="is-size-4">(</span>
                                        {this.printValue(db.strInt(segment.start.identity) === db.strInt(start.identity) ? segment.start : segment.end)}
                                        <span className="is-size-4">)</span>
                                    </>
                                )}
                                <span className="is-size-4 wspace-nowrap">{db.strInt(segment.start.identity) === db.strInt(start.identity) ? "-" : "<-"}[</span>
                                {this.printValue(segment.relationship)}
                                <span className="is-size-4 wspace-nowrap">]{db.strInt(segment.start.identity) === db.strInt(start.identity) ? "->" : "-"}(</span>
                                {this.printValue(db.strInt(segment.start.identity) === db.strInt(start.identity) ? segment.end : segment.start)}
                                <span className="is-size-4">)</span>
                            </>
                        );
                        start = segment.end;
                        first = false;
                        return r;
                    })}
                </div>
            );
        }

        // Temporal values
        if (value instanceof _Date) {
            const fn = settings().temporalValueToStringFunction === "toString" ? "toDateString" : settings().temporalValueToStringFunction;
            return <p className="wspace-nowrap">{value.toStandardDate()[fn]()}</p>;
        }
        if (value instanceof _DateTime) return <p className="wspace-nowrap">{value.toStandardDate()[settings().temporalValueToStringFunction]()}</p>;
        if (value instanceof _Time) return <p className="wspace-nowrap">{value.toString()}</p>;
        if (value instanceof _LocalDateTime) return <p className="wspace-nowrap">{value.toStandardDate().toLocaleString()}</p>;
        if (value instanceof _LocalTime) return <p className="wspace-nowrap">{value.toString()}</p>;
        if (value instanceof _Duration) return <p className="wspace-nowrap">{durationToString(value)}</p>;

        if (typeof value === "object") {
            return (
                <>
                    {value.constructor.name || ""}
                    <div className="control has-icons-right">
                        <pre>{toJSON(value)}</pre>
                        <ClipboardContext.Consumer>
                            {copy => (
                                <span className="icon is-right is-clickable" onClick={copy}>
                                    <i className="fa-regular fa-copy" />
                                </span>
                            )}
                        </ClipboardContext.Consumer>
                    </div>
                </>
            );
        }

        return value.toString();
    };
}

export default Query;
