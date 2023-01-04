import * as React from "react";
import Pagination from "./block/Pagination";
import Modal from "./block/Modal";
import TableSortIcon from "./block/TableSortIcon";
import { neo4j, getDriver, isInteger } from "../db";
import { Button, Checkbox } from "../form";
import IPageProps from "./IPageProps";
import { Integer } from "neo4j-driver";

interface ILabelProps extends IPageProps {
    database: string;
    label: string;
}

/**
 * List all nodes with specific label
 * @todo add events to actions in td row
 */
class Label extends React.Component<ILabelProps> {
    perPage: number = 20;
    hasElementId: boolean = false;

    state = {
        rows: [],
        page: 1,
        total: 0,
        sort: [],
        delete: null,
        error: null,
    };

    requestData = () => {
        getDriver()
            .session({
                database: this.props.database,
                defaultAccessMode: neo4j.session.READ,
            })
            .run("MATCH (n:" + this.props.label + ") RETURN COUNT(n) AS cnt")
            .then(response1 => {
                const cnt: number = response1.records[0].get("cnt");
                const page: number = this.state.page >= Math.ceil(cnt / this.perPage) ? Math.ceil(cnt / this.perPage) : this.state.page;

                getDriver()
                    .session({
                        database: this.props.database,
                        defaultAccessMode: neo4j.session.READ,
                    })
                    .run("MATCH (n:" + this.props.label + ") RETURN n " + (this.state.sort.length ? "ORDER BY " + this.state.sort.join(", ") : "") + " SKIP $s LIMIT $l", {
                        s: neo4j.int((page - 1) * this.perPage),
                        l: neo4j.int(this.perPage),
                    })
                    .then(response2 => {
                        this.setState({
                            rows: response2.records.map(record => record.get("n")),
                            total: cnt,
                            page: page,
                        });
                        this.hasElementId = response2.records.length > 0 && !!response2.records[0].get("n").elementId;
                    })
                    .catch(console.error);
            })
            .catch(console.error);
    };

    componentDidMount() {
        this.requestData();
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
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

    handleOpenDeleteModal = (id: Integer) => {
        this.setState({
            delete: { id: id },
        });
    };

    handleDeleteModalConfirm = () => {
        getDriver()
            .session({
                database: this.props.database,
                defaultAccessMode: neo4j.session.WRITE,
            })
            .run("MATCH (n) WHERE id(n) = $i " + (this.state.delete.detach ? "DETACH " : "") + "DELETE n", {
                i: this.state.delete.id,
            })
            .then(response => {
                if (response.summary.counters.updates().nodesDeleted > 0) {
                    this.requestData();
                    this.props.removeTab("Node#" + neo4j.integer.toString(this.state.delete.id));
                    this.props.toast("Node deleted");
                }
            })
            .catch(error => {
                this.setState({
                    error: error.message,
                });
            })
            .finally(() => {
                this.handleDeleteModalCancel();
            });
    };

    handleDeleteModalCancel = () => {
        this.setState({
            delete: null,
        });
    };

    handleDeleteModalDetachCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({
            delete: {
                ...this.state.delete,
                detach: e.currentTarget.checked,
            },
        });
    };

    handleClearError = () => {
        this.setState({
            error: null,
        });
    };

    handleSetSort = (value: string) => {
        let i = this.state.sort.indexOf(value),
            j = this.state.sort.indexOf(value + " DESC");
        let copy = [...this.state.sort];

        if (i !== -1) {
            copy[i] = value + " DESC";
        } else if (j !== -1) {
            copy.splice(i, 1);
        } else {
            copy.push(value);
        }

        this.setState(
            {
                sort: copy,
            },
            this.requestData
        );
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
                {this.state.delete && (
                    <Modal title="Are you sure?" color="is-danger" handleClose={this.handleDeleteModalCancel}>
                        <div className="mb-3">
                            <Checkbox name="detachDelete" onChange={this.handleDeleteModalDetachCheckbox} label="Detach delete?" checked={this.state.delete.detach} color="is-danger" />
                        </div>
                        <div className="buttons is-justify-content-flex-end">
                            <Button text="Confirm" icon="fa-solid fa-check" onClick={this.handleDeleteModalConfirm} color="is-danger" />
                            <Button text="Cancel" icon="fa-solid fa-xmark" onClick={this.handleDeleteModalCancel} color="is-secondary" />
                        </div>
                    </Modal>
                )}

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
                            this.props.addTab(this.props.generateTabName("New node"), "fa-regular fa-square-plus", "node", { id: null, database: this.props.database, label: this.props.label })
                        }
                    />
                </div>

                <div className="table-container">
                    <table className="table is-bordered is-striped is-narrow is-hoverable">
                        <thead>
                            <tr>
                                <th rowSpan={2}></th>
                                <th rowSpan={2} className="nowrap is-clickable" onClick={() => this.handleSetSort("id(n)")}>
                                    id <TableSortIcon sort="id(n)" current={this.state.sort} />
                                </th>
                                {this.hasElementId && (
                                    <th rowSpan={2} className="nowrap is-clickable" onClick={() => this.handleSetSort("elementId(n)")}>
                                        elementId <TableSortIcon sort="elementId(n)" current={this.state.sort} />
                                    </th>
                                )}
                                {additionalLabels && <th rowSpan={2}>additional labels</th>}
                                <th colSpan={keys.length}>properties</th>
                            </tr>
                            <tr>
                                {keys.map(key => (
                                    <th className="nowrap is-clickable" onClick={() => this.handleSetSort("n." + key)}>
                                        {key} <TableSortIcon sort={"n." + key} current={this.state.sort} />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {this.state.rows.map(row => (
                                <tr>
                                    <td>
                                        <div className="is-flex-wrap-nowrap buttons">
                                            <Button icon="fa-solid fa-circle-nodes" title="Show relationships" />
                                            <Button
                                                icon="fa-solid fa-pen-clip"
                                                title="Edit"
                                                onClick={() =>
                                                    this.props.addTab("Node#" + neo4j.integer.toString(row.identity), "fa-solid fa-pen-to-square", "node", {
                                                        id: row.identity,
                                                        database: this.props.database,
                                                    })
                                                }
                                            />
                                            <Button icon="fa-regular fa-trash-can" color="is-danger is-outlined" title="Delete" onClick={() => this.handleOpenDeleteModal(row.identity)} />
                                        </div>
                                    </td>
                                    <td>{neo4j.integer.toString(row.identity)}</td>
                                    {this.hasElementId && <td className="nowrap is-size-7">{row.elementId}</td>}
                                    {additionalLabels && (
                                        <td>
                                            <span className="buttons">
                                                {row.labels
                                                    .filter(value => value !== this.props.label)
                                                    .map(label => (
                                                        <Button
                                                            color="tag is-link is-rounded px-2"
                                                            onClick={() => this.props.addTab(label, "fa-regular fa-circle", "label", { label: label, database: this.props.database })}
                                                            key={label}
                                                            text={label}
                                                        />
                                                    ))}
                                            </span>
                                        </td>
                                    )}
                                    {keys.map(key => (
                                        <td key={"td-" + key}>
                                            {key in row.properties && (isInteger(row.properties[key]) ? neo4j.integer.toString(row.properties[key]) : row.properties[key].toString())}
                                        </td>
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
}

export default Label;
