import * as React from "react";
import { Button, Checkbox, LabelButton, Textarea, TypeButton } from "../components/form";
import { IPageProps } from "../utils/interfaces";
import db from "../db";
import { ClipboardContext } from "../utils/contexts";
import { Record, ResultSummary, Node as Neo4jNode, Relationship as Neo4jRelationship, Path as Neo4jPath } from "neo4j-driver";
import { EPage } from "../utils/enums";
import Modal from "../components/Modal";

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

/**
 * Execute custom query
 * @todo
 * @todo use https://github.com/memgraph/orb to draw graph
 */
class Query extends React.Component<IQueryProps, IQueryState> {
    state: IQueryState = {
        view: 1,
        tableSize: 1,
        query: this.props.query || localStorage.getItem(this.props.tabId) || "",
        rows: [],
        summary: null,
        error: null,
        propertiesModal: null,
    };

    componentWillUnmount() {
        localStorage.removeItem(this.props.tabId);
    }

    handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        db.driver
            .session({
                database: db.database,
            })
            .run(this.state.query)
            .then(response => {
                console.log(response);
                this.setState({
                    summary: response.summary,
                    rows: response.records,
                });
            })
            .catch(err => {
                this.setState({
                    error: "[" + err.name + "] " + err.message,
                });
            });
    };

    render() {
        if (!this.props.active) return;

        let keys = [];
        this.state.rows.forEach(row => {
            for (let key of row.keys) if (keys.indexOf(key) === -1) keys.push(key);
        });

        return (
            <>
                {this.state.propertiesModal && (
                    <Modal title="Properties" handleClose={() => this.setState({ propertiesModal: null })} icon="fa-solid fa-rectangle-list">
                        <pre>{JSON.stringify(this.state.propertiesModal, null, 2)}</pre>
                        <div className="buttons is-justify-content-flex-end mt-3">
                            <Button text="Close" icon="fa-solid fa-xmark" onClick={() => this.setState({ propertiesModal: null })} />
                        </div>
                    </Modal>
                )}

                <form onSubmit={this.handleSubmit} className="block">
                    <div className="field">
                        <div className="control has-icons-right">
                            <Textarea
                                required
                                name="query"
                                value={this.state.query}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                    this.setState({ query: e.currentTarget.value });
                                    localStorage.setItem(this.props.tabId, e.currentTarget.value);
                                }}
                                color="is-family-code"
                            />
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
                            <Button text="Table" color={this.state.view === 1 ? "is-link is-light is-active" : ""} icon="fa-solid fa-table" onClick={() => this.setState({ view: 1 })} />
                            <Button text="Graph" color={this.state.view === 2 ? "is-link is-light is-active" : ""} icon="fa-solid fa-circle-nodes" onClick={() => this.setState({ view: 2 })} />
                            <Button text="Summary" color={this.state.view === 3 ? "is-link is-light is-active" : ""} icon="fa-solid fa-gauge-high" onClick={() => this.setState({ view: 3 })} />
                        </span>
                        {this.state.view === 1 && (
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
                {this.state.view === 1 && (
                    <div className="block">
                        {this.state.rows.length > 0 && (
                            <div className="table-container">
                                <table className="table is-bordered is-striped is-narrow is-hoverable">
                                    <thead>
                                        <tr>
                                            {keys.map(key => (
                                                <th>{key}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {this.state.rows.map(row => (
                                            <tr>
                                                {keys.map(key => (
                                                    <td>{row.has(key) ? this.printValue(row.get(key)) : ""}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {this.state.rows.length === 0 && <div className="block">No result</div>}
                    </div>
                )}

                {this.state.view === 2 && <div className="block">todo graph</div>}
                {this.state.view === 3 && <div className="block">todo summary</div>}
            </>
        );
    }

    // match p=(n)-[r]->(a) return p, n as node, r, a, n { .* } LIMIT 10
    // MATCH p=()-[]->()-[]->() RETURN p

    printValue = (value: any): string | JSX.Element => {
        if (db.isInteger(value)) return db.strId(value);
        if (Array.isArray(value)) return "[" + value.join(", ") + "]";
        if (typeof value === "boolean") return <Checkbox name="" label="" checked={value} disabled />;

        if (value instanceof Neo4jNode) {
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
        if (value instanceof Neo4jRelationship) {
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
                </div>
            );
        }
        if (value instanceof Neo4jPath) {
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
                                <span className="is-size-4 nowrap">{db.strId(segment.start.identity) === db.strId(start.identity) ? "-" : "<-"}[</span>
                                {this.printValue(segment.relationship)}
                                <span className="is-size-4 nowrap">]{db.strId(segment.start.identity) === db.strId(start.identity) ? "->" : "-"}(</span>
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

        if (typeof value === "object") {
            return Object.keys(value)
                .map(key => key + ": " + this.printValue(value[key]))
                .join(", ");
        }

        return value.toString();
    };
}

export default Query;
