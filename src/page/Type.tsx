import * as React from "react";
import Pagination from "./block/Pagination";
import { neo4j, getDriver } from "../db";
import { Relationship as Neo4jRelationship } from "neo4j-driver";
import { Button } from "../form";
import { EPage } from "../enums";
import { IPageProps } from "../interfaces";

interface ITypeProps extends IPageProps {
    database: string;
    type: string;
}

interface ITypeState {
    rows: Neo4jRelationship[];
    page: number;
    total: number;
    sort: string[];
    delete: number | null;
    error: string | null;
}

/**
 * List all relationships with specific relationshipType
 * @todo
 */
class Type extends React.Component<ITypeProps, ITypeState> {
    perPage: number = 20;
    hasElementId: boolean = false;

    state: ITypeState = {
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
            .run("MATCH ()-[r:" + this.props.type + "]-() RETURN COUNT(r) AS cnt")
            .then(response1 => {
                const cnt: number = response1.records[0].get("cnt");
                const page: number = this.state.page >= Math.ceil(cnt / this.perPage) ? Math.ceil(cnt / this.perPage) : this.state.page;

                getDriver()
                    .session({
                        database: this.props.database,
                        defaultAccessMode: neo4j.session.READ,
                    })
                    .run("MATCH ()-[r:" + this.props.type + "]->() RETURN r " + (this.state.sort.length ? "ORDER BY " + this.state.sort.join(", ") : "") + " SKIP $s LIMIT $l", {
                        s: neo4j.int((page - 1) * this.perPage),
                        l: neo4j.int(this.perPage),
                    })
                    .then(response2 => {
                        this.setState({
                            rows: response2.records.map(record => record.get("r")),
                            total: cnt,
                            page: page,
                        });
                        this.hasElementId =
                            response2.records.length > 0 &&
                            "elementId" in response2.records[0].get("r") &&
                            response2.records[0].get("r").elementId !== neo4j.integer.toString(response2.records[0].get("r").identity);
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
            s = s.replace(/^n\.([^ ]+)(?: DESC)?$/, "$1");
            if (keys.indexOf(s) === -1) keys.push(s);
        }
        keys.sort();

        return (
            <>
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
                            {"MATCH (a)-[" +
                                this.props.type +
                                "]->(b) RETURN r, a, b " +
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
                            this.props.tabManager.add(this.props.tabManager.generateName("New relationship"), "fa-regular fa-square-plus", EPage.Rel, {
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
                            <tr></tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>

                <Pagination page={this.state.page} pages={Math.ceil(this.state.total / this.perPage)} action={this.handleChangePage} />
            </>
        );
    }
}

export default Type;
