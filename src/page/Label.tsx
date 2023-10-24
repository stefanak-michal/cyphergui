import * as React from "react";
import Pagination from "../components/Pagination";
import TableSortIcon from "../components/TableSortIcon";
import { Button, Checkbox, LabelButton } from "../components/form";
import { Node as _Node } from "neo4j-driver";
import { EPage, EQueryView } from "../utils/enums";
import { IPageProps } from "../utils/interfaces";
import db from "../db";
import { DeleteModal } from "../components/Modal";
import { settings } from "../layout/Settings";

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
    };

    requestData = () => {
        db.query("MATCH (n:" + this.props.label + ") RETURN COUNT(n) AS cnt", {}, this.props.database)
            .then(response1 => {
                const cnt: number = db.fromInt(response1.records[0].get("cnt"));
                const page: number = Math.min(this.state.page, Math.ceil(cnt / this.perPage));

                db.query(
                    "MATCH (n:" + this.props.label + ") RETURN n " + (this.state.sort.length ? "ORDER BY " + this.state.sort.join(", ") : "") + " SKIP $s LIMIT $l",
                    {
                        s: db.toInt((page - 1) * this.perPage),
                        l: db.toInt(this.perPage),
                    },
                    this.props.database
                )
                    .then(response2 => {
                        this.setState({
                            rows: response2.records.map(record => record.get("n")),
                            total: cnt,
                            page: page,
                        });
                    })
                    .catch(err => this.setState({ error: "[" + err.name + "] " + err.message }));
            })
            .catch(err => {
                console.log(err);
                this.props.tabManager.close(this.props.tabId);
            });
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
            this.props.database,
            true
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

        const additionalLabels = this.state.rows.filter(row => row.labels.length > 1).length > 0;

        const printQuery =
            "MATCH (n:" +
            this.props.label +
            ") RETURN n" +
            (this.state.sort.length ? " ORDER BY " + this.state.sort.join(", ") : "") +
            " SKIP " +
            (this.state.page - 1) * this.perPage +
            " LIMIT " +
            this.perPage;

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
                        <span className="is-family-code">{printQuery}</span>
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
                                    label: this.props.label,
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
                </div>

                <div className="table-container">
                    <table className="table is-bordered is-striped is-narrow is-hoverable">
                        <thead>
                            <tr>
                                <th colSpan={settings().tableViewShowElementId && db.hasElementId ? 3 : 2}>Node</th>
                                {additionalLabels && <th rowSpan={2}>additional labels</th>}
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
