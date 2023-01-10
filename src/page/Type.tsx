import * as React from "react";
import Pagination from "../components/Pagination";
import { Integer, Relationship as Neo4jRelationship } from "neo4j-driver";
import { Button, Checkbox } from "../components/form";
import { EPage } from "../utils/enums";
import { IPageProps } from "../utils/interfaces";
import TableSortIcon from "../components/TableSortIcon";
import { DeleteModal } from "../components/Modal";
import db from "../db";

interface ITypeProps extends IPageProps {
    database: string;
    type: string;
}

interface ITypeState {
    rows: Neo4jRelationship[];
    page: number;
    total: number;
    sort: string[];
    delete: Integer | string | false;
    error: string | null;
}

/**
 * List all relationships with specific relationshipType
 */
class Type extends React.Component<ITypeProps, ITypeState> {
    perPage: number = 20;

    state: ITypeState = {
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
            .run("MATCH ()-[r:" + this.props.type + "]->() RETURN COUNT(r) AS cnt")
            .then(response1 => {
                const cnt: number = response1.records[0].get("cnt");
                const page: number = this.state.page >= Math.ceil(cnt / this.perPage) ? Math.ceil(cnt / this.perPage) : this.state.page;

                db.getDriver()
                    .session({
                        database: this.props.database,
                        defaultAccessMode: db.neo4j.session.READ,
                    })
                    .run("MATCH (a)-[r:" + this.props.type + "]->(b) RETURN r " + (this.state.sort.length ? "ORDER BY " + this.state.sort.join(", ") : "") + " SKIP $s LIMIT $l", {
                        s: db.neo4j.int((page - 1) * this.perPage),
                        l: db.neo4j.int(this.perPage),
                    })
                    .then(response2 => {
                        this.setState({
                            rows: response2.records.map(record => record.get("r")),
                            total: cnt,
                            page: page,
                        });
                    })
                    .catch(console.error);
            })
            .catch(err => {
                console.error(err);
                this.props.tabManager.close(this.props.tabId);
            });
    };

    componentDidMount() {
        this.requestData();
    }

    shouldComponentUpdate(nextProps: Readonly<ITypeProps>) {
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

    handleClearError = () => {
        this.setState({
            error: null,
        });
    };

    handleDeleteModalConfirm = (id: Integer | string) => {
        db.getDriver()
            .session({
                database: this.props.database,
                defaultAccessMode: db.neo4j.session.WRITE,
            })
            .run("MATCH ()-[r]-() WHERE " + db.fnId("r") + " = $id DELETE r", {
                id: id,
            })
            .then(response => {
                if (response.summary.counters.updates().nodesDeleted > 0) {
                    this.requestData();
                    this.props.tabManager.close(db.strId(id) + this.props.database);
                    this.props.toast("Relationship deleted");
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
        if (!this.props.active) return;
        document.title = this.props.type + " relationship (db: " + this.props.database + ")";

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
            s = s.replace(/^r\.([^ ]+)(?: DESC)?$/, "$1");
            if (keys.indexOf(s) === -1) keys.push(s);
        }
        keys.sort();

        return (
            <>
                {this.state.delete && <DeleteModal delete={this.state.delete} handleConfirm={this.handleDeleteModalConfirm} handleClose={() => this.setState({ delete: false })} />}

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
                            {"MATCH (a)-[r:" +
                                this.props.type +
                                "]->(b) RETURN r " +
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
                        text="Create relationship"
                        color="is-primary"
                        onClick={() =>
                            this.props.tabManager.add({ prefix: "New relationship" }, "fa-regular fa-square-plus", EPage.Rel, {
                                id: null,
                                database: this.props.database,
                                type: this.props.type,
                            })
                        }
                    />
                </div>

                <div className="table-container">
                    <table className="table is-bordered is-striped is-narrow is-hoverable">
                        <thead>
                            <tr>
                                <th colSpan={this.props.settings.tableViewShowElementId && db.hasElementId ? 3 : 2}>Relationship</th>
                                {keys.length > 0 ? <th colSpan={keys.length}>properties</th> : ""}
                                <th colSpan={this.props.settings.tableViewShowElementId && db.hasElementId ? 2 : 1}>Start node</th>
                                <th colSpan={this.props.settings.tableViewShowElementId && db.hasElementId ? 2 : 1}>End node</th>
                            </tr>
                            <tr>
                                <th rowSpan={2} className="nowrap is-clickable" onClick={() => this.handleSetSort("id(r)")}>
                                    id <TableSortIcon sort="id(r)" current={this.state.sort} />
                                </th>
                                {this.props.settings.tableViewShowElementId && db.hasElementId && (
                                    <th rowSpan={2} className="nowrap is-clickable" onClick={() => this.handleSetSort("elementId(r)")}>
                                        elementId <TableSortIcon sort="elementId(r)" current={this.state.sort} />
                                    </th>
                                )}
                                <th></th>
                                {keys.map(key => (
                                    <th key={"th-" + key} className="nowrap is-clickable" onClick={() => this.handleSetSort("r." + key)}>
                                        {key} <TableSortIcon sort={"r." + key} current={this.state.sort} />
                                    </th>
                                ))}

                                <th className="nowrap is-clickable" onClick={() => this.handleSetSort("id(a)")}>
                                    id <TableSortIcon sort={"id(a)"} current={this.state.sort} />
                                </th>
                                {this.props.settings.tableViewShowElementId && db.hasElementId && (
                                    <th className="nowrap is-clickable" onClick={() => this.handleSetSort("elementId(a)")}>
                                        elementId <TableSortIcon sort={"elementId(a)"} current={this.state.sort} />
                                    </th>
                                )}
                                <th className="nowrap is-clickable" onClick={() => this.handleSetSort("id(b)")}>
                                    id <TableSortIcon sort={"id(b)"} current={this.state.sort} />
                                </th>
                                {this.props.settings.tableViewShowElementId && db.hasElementId && (
                                    <th className="nowrap is-clickable" onClick={() => this.handleSetSort("elementId(b)")}>
                                        elementId <TableSortIcon sort={"elementId(b)"} current={this.state.sort} />
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {this.state.rows.map(row => (
                                <tr key={"tr-" + db.neo4j.integer.toString(row.identity)}>
                                    <td>
                                        <Button
                                            onClick={() =>
                                                this.props.tabManager.add({ prefix: "Rel", i: row.identity }, "fa-solid fa-pen-to-square", EPage.Rel, {
                                                    id: db.hasElementId ? row.elementId : row.identity,
                                                    database: this.props.database,
                                                })
                                            }
                                            icon="fa-solid fa-pen-clip"
                                            text={"#" + db.neo4j.integer.toString(row.identity)}
                                        />
                                    </td>
                                    {this.props.settings.tableViewShowElementId && db.hasElementId && <td className="nowrap">{row.elementId}</td>}
                                    <td>
                                        <div className="is-flex-wrap-nowrap buttons">
                                            {this.props.stashManager.button(row, this.props.database)}
                                            <Button
                                                icon="fa-regular fa-trash-can"
                                                color="is-danger is-outlined"
                                                title="Delete"
                                                onClick={() => this.setState({ delete: db.hasElementId ? row.elementId : row.identity })}
                                            />
                                        </div>
                                    </td>
                                    {keys.map(key => (
                                        <td key={"td-" + key}>{key in row.properties && this.printProperty(row.properties[key])}</td>
                                    ))}

                                    <td>
                                        <Button
                                            onClick={() =>
                                                this.props.tabManager.add({ prefix: "Node", i: row.start }, "fa-solid fa-pen-to-square", EPage.Node, {
                                                    id: db.hasElementId ? row.startNodeElementId : row.start,
                                                    database: this.props.database,
                                                })
                                            }
                                            icon="fa-solid fa-pen-clip"
                                            text={"#" + db.neo4j.integer.toString(row.start)}
                                        />
                                    </td>
                                    {this.props.settings.tableViewShowElementId && db.hasElementId && <td className="nowrap">{row.startNodeElementId}</td>}
                                    <td>
                                        <Button
                                            onClick={() =>
                                                this.props.tabManager.add({ prefix: "Node", i: row.end }, "fa-solid fa-pen-to-square", EPage.Node, {
                                                    id: db.hasElementId ? row.endNodeElementId : row.end,
                                                    database: this.props.database,
                                                })
                                            }
                                            icon="fa-solid fa-pen-clip"
                                            text={"#" + db.neo4j.integer.toString(row.end)}
                                        />
                                    </td>
                                    {this.props.settings.tableViewShowElementId && db.hasElementId && <td className="nowrap">{row.endNodeElementId}</td>}
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

export default Type;
