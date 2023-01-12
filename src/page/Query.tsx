import * as React from "react";
import { Button, LabelButton, Textarea, TypeButton } from "../components/form";
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
import { EPage } from "../utils/enums";
import Modal from "../components/Modal";
import { settings } from "../layout/Settings";
import Duration from "../utils/Duration";
import { Orb, OrbEventType } from "@memgraph/orb";

interface IQueryProps extends IPageProps {
    query?: string;
}

interface IQueryState {
    view: number;
    tableSize: number;
    query: string;
    rows: Record[];
    summary: ResultSummary;
    error: string | null;
    propertiesModal: object | null;
}

interface MyNode {
    id: string;
    label: string;
    elementId: string | null;
}

interface MyEdge {
    id: string;
    label: string;
    start: any;
    end: any;
    elementId: string | null;
}

/**
 * Execute custom query
 * todo syntax highlight
 * todo Stash query - ref pre tab?!
 * todo improve graph view (not yet defined how)
 */
class Query extends React.Component<IQueryProps, IQueryState> {
    state: IQueryState = {
        view: 1,
        tableSize: 2,
        query: this.props.query || localStorage.getItem(this.props.tabId) || "",
        rows: [],
        summary: null,
        error: null,
        propertiesModal: null,
    };

    showTableSize = false;
    graphElement = React.createRef<HTMLDivElement>();
    orb: Orb;

    componentWillUnmount() {
        localStorage.removeItem(this.props.tabId);
    }

    setShowTableSize = (value: any) => {
        if (Array.isArray(value)) {
            value.forEach(this.setShowTableSize);
        } else if (typeof value === "object") {
            if (value instanceof _Node || value instanceof _Relationship || value instanceof _Path) this.showTableSize = true;
            else this.setShowTableSize(Object.values(value));
        }
    };

    handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        this.showTableSize = false;

        db.driver
            .session({
                database: db.database,
            })
            .run(this.state.query)
            .then(response => {
                console.log(response);
                this.setShowTableSize(response.records);
                this.setState({
                    summary: response.summary,
                    rows: response.records,
                    error: null,
                });
            })
            .catch(err => {
                this.setState({
                    rows: [],
                    summary: null,
                    error: "[" + err.name + "] " + err.message,
                });
            });
    };

    changeView = (i: number) => {
        this.setState(
            {
                view: i,
            },
            () => {
                if (this.state.view === 2) {
                    const current = this.graphElement.current;
                    if (!current) return;

                    this.orb = new Orb<MyNode, MyEdge>(current);

                    let nodes: MyNode[] = [];
                    let edges: MyEdge[] = [];
                    this.state.rows.forEach(row => {
                        for (let key of row.keys) {
                            const value = row.get(key);
                            if (value instanceof _Node) nodes.push({ id: db.strId(value.identity), label: ":" + value.labels.join(":"), elementId: db.hasElementId ? value.elementId : null });
                            else if (value instanceof _Relationship)
                                edges.push({
                                    id: db.strId(value.identity),
                                    start: db.strId(value.start),
                                    end: db.strId(value.end),
                                    label: ":" + value.type,
                                    elementId: db.hasElementId ? value.elementId : null,
                                });
                        }
                    });

                    this.orb.data.setup({ nodes, edges });
                    this.orb.view.render(() => {
                        this.orb.view.recenter();
                    });

                    this.orb.events.on(OrbEventType.NODE_CLICK, event => {
                        this.props.tabManager.add({ prefix: "Node", i: event.node.id }, "fa-solid fa-pen-to-square", EPage.Node, {
                            id: db.hasElementId ? event.node.data.elementId : event.node.id,
                            database: db.database,
                        });
                    });

                    this.orb.events.on(OrbEventType.EDGE_CLICK, event => {
                        this.props.tabManager.add({ prefix: "Rel", i: event.edge.id }, "fa-solid fa-pen-to-square", EPage.Rel, {
                            id: db.hasElementId ? event.edge.data.elementId : event.edge.id,
                            database: db.database,
                        });
                    });
                }
            }
        );
    };

    render() {
        let keys = [];
        this.state.rows.forEach(row => {
            for (let key of row.keys) if (!keys.includes(key)) keys.push(key);
        });

        return (
            <>
                {this.state.propertiesModal && (
                    <Modal title="Properties" handleClose={() => this.setState({ propertiesModal: null })} icon="fa-solid fa-rectangle-list" backdrop={true}>
                        <div className="control has-icons-right">
                            <pre>{this.toJSON(this.state.propertiesModal)}</pre>
                            <ClipboardContext.Consumer>
                                {copy => (
                                    <span className="icon is-right is-clickable" onClick={copy} data-copy={this.toJSON(this.state.propertiesModal)}>
                                        <i className="fa-regular fa-copy" />
                                    </span>
                                )}
                            </ClipboardContext.Consumer>
                        </div>
                    </Modal>
                )}

                <form onSubmit={this.handleSubmit} className="block">
                    <div className="field">
                        <div className="control has-icons-right has-icons-left">
                            <Textarea
                                required
                                name="query"
                                value={this.state.query}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                    this.setState({ query: e.currentTarget.value });
                                    localStorage.setItem(this.props.tabId, e.currentTarget.value);
                                }}
                                color="is-family-code"
                                focus={true}
                            />
                            <span className="icon is-left">
                                <i className="fa-solid fa-terminal" aria-hidden="true" />
                            </span>
                            <ClipboardContext.Consumer>
                                {copy => (
                                    <span className="icon is-right is-clickable" onClick={copy} data-copy={this.state.query}>
                                        <i className="fa-regular fa-copy" />
                                    </span>
                                )}
                            </ClipboardContext.Consumer>
                        </div>
                    </div>
                    <div className="field">
                        <div className="buttons is-justify-content-flex-end">
                            <Button color="is-success" type="submit" icon="fa-solid fa-check" text="Execute" />
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
                            <Button text="Table" color={this.state.view === 1 ? "is-link is-light is-active" : ""} icon="fa-solid fa-table" onClick={() => this.changeView(1)} />
                            <Button text="JSON" color={this.state.view === 4 ? "is-link is-light is-active" : ""} icon="fa-brands fa-js" onClick={() => this.changeView(4)} />
                            <Button text="Graph" color={this.state.view === 2 ? "is-link is-light is-active" : ""} icon="fa-solid fa-circle-nodes" onClick={() => this.changeView(2)} />
                            <Button text="Summary" color={this.state.view === 3 ? "is-link is-light is-active" : ""} icon="fa-solid fa-gauge-high" onClick={() => this.changeView(3)} />
                        </span>
                        {this.state.view === 1 && this.showTableSize && (
                            <span className="ml-3">
                                <Button
                                    color={this.state.tableSize === 1 ? "is-link is-light is-active" : ""}
                                    icon="fa-solid fa-arrows-up-down is-size-7"
                                    onClick={() => this.setState({ tableSize: 1 })}>
                                    <span className="is-size-7">Small</span>
                                </Button>
                                <Button
                                    text="Medium"
                                    color={this.state.tableSize === 2 ? "is-link is-light is-active" : ""}
                                    icon="fa-solid fa-arrows-up-down"
                                    onClick={() => this.setState({ tableSize: 2 })}
                                />
                            </span>
                        )}
                    </div>
                </div>

                {this.state.rows.length > 0 && (
                    <div className="block">
                        {this.state.view === 1 && (
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
                        )}
                        {this.state.view === 2 && (
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
                            </div>
                        )}

                        {this.state.view === 3 && (
                            <div className="control has-icons-right">
                                <pre>{this.toJSON(this.state.summary)}</pre>
                                <ClipboardContext.Consumer>
                                    {copy => (
                                        <span className="icon is-right is-clickable" onClick={copy} data-copy={this.toJSON(this.state.rows)}>
                                            <i className="fa-regular fa-copy" />
                                        </span>
                                    )}
                                </ClipboardContext.Consumer>
                            </div>
                        )}
                        {this.state.view === 4 && (
                            <div className="control has-icons-right">
                                <pre>{this.toJSON(this.state.rows)}</pre>
                                <ClipboardContext.Consumer>
                                    {copy => (
                                        <span className="icon is-right is-clickable" onClick={copy} data-copy={this.toJSON(this.state.rows)}>
                                            <i className="fa-regular fa-copy" />
                                        </span>
                                    )}
                                </ClipboardContext.Consumer>
                            </div>
                        )}
                    </div>
                )}

                {this.state.rows.length === 0 && <div className="block">No result</div>}
            </>
        );
    }

    toJSON = (data: any[] | object): string => {
        let obj;
        if (Array.isArray(data)) {
            obj = [];
            data.forEach(row => {
                let entry = {};
                for (let key of row.keys) entry[key] = row.get(key);
                obj.push(entry);
            });
        } else if (typeof data === "object") {
            obj = data;
        }

        return JSON.stringify(
            obj,
            (key, value) => {
                if (db.isInteger(value)) return parseFloat(db.strId(value));
                return value;
            },
            2
        );
    };

    // match (a)-[r]->(b) return * limit 100
    // match p=(n)-[r]->(a) return p, n as node, r, a, n { .* } LIMIT 10
    // MATCH p=()-[]->()-[]->() RETURN p

    printValue = (value: any): JSX.Element => {
        if (db.isInteger(value)) return <>{db.strId(value)}</>;
        if (Array.isArray(value)) return <>[{value.map<React.ReactNode>(entry => this.printValue(entry)).reduce((prev, curr) => [prev, ", ", curr])}]</>;
        if (typeof value === "boolean") return <>{value ? "true" : "false"}</>;
        if (typeof value === "string") return <p className="wspace-pre">{value}</p>;

        if (value instanceof _Node) {
            return (
                <div className="is-flex is-align-items-center is-justify-content-flex-start">
                    {value.labels.map(label => (
                        <LabelButton key={label} label={label} database={db.database} tabManager={this.props.tabManager} size={"mr-1 " + (this.state.tableSize === 1 ? "" : "is-medium")} />
                    ))}
                    <Button
                        onClick={() =>
                            this.props.tabManager.add({ prefix: "Node", i: value.identity }, "fa-solid fa-pen-to-square", EPage.Node, {
                                id: db.hasElementId ? value.elementId : value.identity,
                                database: db.database,
                            })
                        }
                        icon="fa-solid fa-pen-clip"
                        color={this.state.tableSize === 1 ? "is-small" : ""}
                        text={"#" + db.strId(value.identity)}
                    />
                    {Object.keys(value.properties).length > 0 && (
                        <Button
                            icon="fa-solid fa-rectangle-list"
                            onClick={() => this.setState({ propertiesModal: value.properties })}
                            color={"ml-1 " + (this.state.tableSize === 1 ? "is-small" : "")}
                        />
                    )}
                </div>
            );
        }
        if (value instanceof _Relationship) {
            return (
                <div className="is-flex is-align-items-center is-justify-content-flex-start">
                    <TypeButton type={value.type} database={db.database} tabManager={this.props.tabManager} size={this.state.tableSize === 1 ? "" : "is-medium"} />
                    <Button
                        onClick={() =>
                            this.props.tabManager.add({ prefix: "Rel", i: value.identity }, "fa-solid fa-pen-to-square", EPage.Rel, {
                                id: db.hasElementId ? value.elementId : value.identity,
                                database: db.database,
                            })
                        }
                        color={"ml-1 " + (this.state.tableSize === 1 ? "is-small" : "")}
                        icon="fa-solid fa-pen-clip"
                        text={"#" + db.strId(value.identity)}
                    />
                    {Object.keys(value.properties).length > 0 && (
                        <Button
                            icon="fa-solid fa-rectangle-list"
                            onClick={() => this.setState({ propertiesModal: value.properties })}
                            color={"ml-1 " + (this.state.tableSize === 1 ? "is-small" : "")}
                        />
                    )}
                </div>
            );
        }
        if (value instanceof _Path) {
            let start = value.start;
            let first = true;
            return (
                <div className="is-flex is-align-items-center is-justify-content-flex-start">
                    {value.segments.map(segment => {
                        const r = (
                            <>
                                {first && (
                                    <>
                                        <span className="is-size-4">(</span>
                                        {this.printValue(db.strId(segment.start.identity) === db.strId(start.identity) ? segment.start : segment.end)}
                                        <span className="is-size-4">)</span>
                                    </>
                                )}
                                <span className="is-size-4 wspace-nowrap">{db.strId(segment.start.identity) === db.strId(start.identity) ? "-" : "<-"}[</span>
                                {this.printValue(segment.relationship)}
                                <span className="is-size-4 wspace-nowrap">]{db.strId(segment.start.identity) === db.strId(start.identity) ? "->" : "-"}(</span>
                                {this.printValue(db.strId(segment.start.identity) === db.strId(start.identity) ? segment.end : segment.start)}
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
        if (value instanceof _Duration) return <p className="wspace-nowrap">{new Duration(value).toString()}</p>;

        if (typeof value === "object") {
            const json = this.toJSON(value);
            return (
                <>
                    {value.constructor.name || ""}
                    <div className="control has-icons-right">
                        <pre>{json}</pre>
                        <ClipboardContext.Consumer>
                            {copy => (
                                <span className="icon is-right is-clickable" onClick={copy} data-copy={json}>
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
