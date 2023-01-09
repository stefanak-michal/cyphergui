import * as React from "react";
import Pagination from "./block/Pagination";
import { DeleteModal } from "./block/Modal";
import TableSortIcon from "./block/TableSortIcon";
import { Button, Checkbox, LabelButton } from "../form";
import { Integer, Node as Neo4jNode } from "neo4j-driver";
import { EPage } from "../enums";
import { IPageProps } from "../interfaces";
import db from "../db";

interface ILabelProps extends IPageProps {
    database: string;
    label: string;
}

interface ILabelState {
    rows: Neo4jNode[];
    page: number;
    total: number;
    sort: string[];
    delete: Integer | string | false;
    error: string | null;
}

/**
 * List all nodes with specific label
 */
class Label extends React.Component<ILabelProps, ILabelState> {
    perPage: number = 20;

    state: ILabelState = {
        rows: [],
        page: 1,
        total: 0,
        sort: [],
        delete: false,
        error: null,
    };

    requestData = () => {
        db.getDriver()
            .session({
                database: this.props.database,
                defaultAccessMode: db.neo4j.session.READ,
            })
            .run("MATCH (n:" + this.props.label + ") RETURN COUNT(n) AS cnt")
            .then(response1 => {
                const cnt: number = response1.records[0].get("cnt");
                const page: number = this.state.page >= Math.ceil(cnt / this.perPage) ? Math.ceil(cnt / this.perPage) : this.state.page;

                db.getDriver()
                    .session({
                        database: this.props.database,
                        defaultAccessMode: db.neo4j.session.READ,
                    })
                    .run("MATCH (n:" + this.props.label + ") RETURN n " + (this.state.sort.length ? "ORDER BY " + this.state.sort.join(", ") : "") + " SKIP $s LIMIT $l", {
                        s: db.neo4j.int((page - 1) * this.perPage),
                        l: db.neo4j.int(this.perPage),
                    })
                    .then(response2 => {
                        this.setState({
                            rows: response2.records.map(record => record.get("n")),
                            total: cnt,
                            page: page,
                        });
                    })
                    .catch(console.error);
            })
            .catch(console.error);
    };

    componentDidMount() {
        this.requestData();
    }

    shouldComponentUpdate(nextProps: Readonly<ILabelProps>) {
        if (nextProps.active && this.props.active !== nextProps.active) {
            this.requestData();
        }
        return true;
    }

    handleChangePage = (page: number) => {
        this.setState(
            {
                page: page,
            },
            this.requestData
        );
    };

    handleDeleteModalConfirm = (id: Integer | string, detach: boolean) => {
        db.getDriver()
            .session({
                database: this.props.database,
                defaultAccessMode: db.neo4j.session.WRITE,
            })
            .run("MATCH (n) WHERE " + db.fnId() + " = $id " + (detach ? "DETACH " : "") + "DELETE n", {
                id: id,
            })
            .then(response => {
                if (response.summary.counters.updates().nodesDeleted > 0) {
                    this.requestData();
                    this.props.tabManager.close(db.strId(id) + this.props.database);
                    this.props.toast("Node deleted");
                }
            })
            .catch(error => {
                this.setState({
                    error: error.message,
                });
            });
    };

    handleClearError = () => {
        this.setState({
            error: null,
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

    render() {
        if (!this.props.active) return;
        document.title = this.props.label + " label (db: " + this.props.database + ")";

        let keys = [];
        for (let row of this.state.rows) {
            for (let k in row.properties) {
                if (keys.indexOf(k) === -1) {
                    keys.push(k);
                }
            }
        }
        //add sorted keys which are not available in visible rows
        for (let s of this.state.sort) {
            s = s.replace(/^n\.([^ ]+)(?: DESC)?$/, "$1");
            if (keys.indexOf(s) === -1) keys.push(s);
        }
        keys.sort();

        const additionalLabels = this.state.rows.filter(row => row.labels.length > 1).length > 0;

        return (
            <>
                {this.state.delete && <DeleteModal delete={this.state.delete} detach handleConfirm={this.handleDeleteModalConfirm} handleClose={() => this.setState({ delete: false })} />}

                {typeof this.state.error === "string" && (
                    <div className="message is-danger">
                        <div className="message-header">
                            <p>Error</p>
                            <button className="delete" aria-label="delete" onClick={this.handleClearError}></button>
                        </div>
                        <div className="message-body">{this.state.error}</div>
                    </div>
                )}

                <div className="mb-3">
                    <span className="icon-text is-flex-wrap-nowrap">
                        <span className="icon">
                            <i className="fa-solid fa-terminal" aria-hidden="true"></i>
                        </span>
                        <span className="is-family-code">
                            {"MATCH (n:" +
                                this.props.label +
                                ") RETURN n " +
                                (this.state.sort.length ? "ORDER BY " + this.state.sort.join(", ") : "") +
                                " SKIP " +
                                (this.state.page - 1) * this.perPage +
                                " LIMIT " +
                                this.perPage}
                        </span>
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
                                "fa-regular fa-square-plus",
                                EPage.Node,
                                {
                                    id: null,
                                    database: this.props.database,
                                    label: this.props.label,
                                },
                                new Date().getTime().toString()
                            )
                        }
                    />
                </div>

                <div className="table-container">
                    <table className="table is-bordered is-striped is-narrow is-hoverable">
                        <thead>
                            <tr>
                                <th rowSpan={2}></th>
                                <th colSpan={this.props.settings.tableViewShowElementId && db.hasElementId ? 2 : 1}>Node</th>
                                {additionalLabels && <th rowSpan={2}>additional labels</th>}
                                {keys.length > 0 ? <th colSpan={keys.length}>properties</th> : ""}
                            </tr>
                            <tr>
                                <th className="nowrap is-clickable" onClick={() => this.handleSetSort("id(n)")}>
                                    id <TableSortIcon sort="id(n)" current={this.state.sort} />
                                </th>
                                {this.props.settings.tableViewShowElementId && db.hasElementId && (
                                    <th className="nowrap is-clickable" onClick={() => this.handleSetSort("elementId(n)")}>
                                        elementId <TableSortIcon sort="elementId(n)" current={this.state.sort} />
                                    </th>
                                )}
                                {keys.map(key => (
                                    <th key={"th-" + key} className="nowrap is-clickable" onClick={() => this.handleSetSort("n." + key)}>
                                        {key} <TableSortIcon sort={"n." + key} current={this.state.sort} />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {this.state.rows.map(row => (
                                <tr key={"tr-" + db.neo4j.integer.toString(row.identity)}>
                                    <td>
                                        <div className="is-flex-wrap-nowrap buttons">
                                            {/*<Button icon="fa-solid fa-circle-nodes" title="Show relationships" />*/}
                                            {this.props.stashManager.button(row, this.props.database)}
                                            <Button
                                                icon="fa-regular fa-trash-can"
                                                color="is-danger is-outlined"
                                                title="Delete"
                                                onClick={() => this.setState({ delete: db.hasElementId ? row.elementId : row.identity })}
                                            />
                                        </div>
                                    </td>
                                    <td>
                                        <Button
                                            onClick={() =>
                                                this.props.tabManager.add({ prefix: "Node", i: row.identity }, "fa-solid fa-pen-to-square", EPage.Node, {
                                                    id: db.hasElementId ? row.elementId : row.identity,
                                                    database: this.props.database,
                                                })
                                            }
                                            icon="fa-solid fa-pen-clip"
                                            text={"#" + db.neo4j.integer.toString(row.identity)}
                                        />
                                    </td>
                                    {this.props.settings.tableViewShowElementId && db.hasElementId && <td className="nowrap">{row.elementId}</td>}
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

    printProperty = (property: any): string | JSX.Element => {
        if (db.isInteger(property)) return db.neo4j.integer.toString(property);
        if (Array.isArray(property)) return "[" + property.join(", ") + "]";
        if (typeof property === "boolean") return <Checkbox name="" label="" checked={property} disabled />;
        return property.toString();
    };
}

export default Label;
