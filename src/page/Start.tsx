import * as React from "react";
import { Button, LabelButton, TypeButton } from "../components/form";
import { EPage } from "../utils/enums";
import { IPageProps } from "../utils/interfaces";
import db from "../db";

interface IStartState {
    labels: string[];
    types: string[];
    serverInfo: object;
}

class Start extends React.Component<IPageProps, IStartState> {
    state: IStartState = {
        labels: [],
        types: [],
        serverInfo: {},
    };

    componentDidMount() {
        db.registerChangeActiveDatabaseCallback(this.requestData);
        this.requestData();
    }

    componentDidUpdate(prevProps: Readonly<IPageProps>) {
        if (prevProps.active !== this.props.active && this.props.active) this.requestData();
    }

    requestData = () => {
        Promise.all([
            db.driver.session({ database: db.database, defaultAccessMode: db.neo4j.session.READ }).run("MATCH (n) WITH DISTINCT labels(n) AS ll UNWIND ll AS l RETURN collect(DISTINCT l) AS c"),
            db.driver.session({ database: db.database, defaultAccessMode: db.neo4j.session.READ }).run("MATCH ()-[n]-() RETURN collect(DISTINCT type(n)) AS c"),
            db.driver.getServerInfo(),
        ])
            .then(responses => {
                this.setState({
                    labels: responses[0].records[0].get("c"),
                    types: responses[1].records[0].get("c"),
                    serverInfo: responses[2],
                });
            })
            .catch(error => {
                console.error(error);
            });
    };

    render() {
        return (
            <div className="columns">
                <div className="column is-three-fifths-desktop is-offset-one-fifth-desktop">
                    <div className="subtitle mb-2">Server</div>
                    {Object.keys(this.state.serverInfo).length ? (
                        <div>
                            Connected to <b>{this.state.serverInfo["address"] || ""}</b> with protocol version <b>{this.state.serverInfo["protocolVersion"] || ""}</b>.
                        </div>
                    ) : (
                        <div>Loading ...</div>
                    )}
                    <br />
                    <div className="subtitle mb-2">Node labels</div>
                    <div className="buttons">
                        {this.state.labels.length > 0 ? (
                            this.state.labels.map(label => <LabelButton key={label} label={label} database={db.database} tabManager={this.props.tabManager} size="is-medium" />)
                        ) : (
                            <span className="has-text-grey-light">none</span>
                        )}
                    </div>
                    <div className="buttons">
                        <Button
                            icon="fa-solid fa-plus"
                            text="Create node"
                            color=""
                            onClick={() =>
                                this.props.tabManager.add({ prefix: "New node" }, "fa-solid fa-square-plus", EPage.Node, { id: null, database: db.database }, new Date().getTime().toString())
                            }
                        />
                    </div>
                    <br />
                    <div className="subtitle mb-2">Relationship types</div>
                    <div className="buttons">
                        {this.state.types.length > 0 ? (
                            this.state.types.map(type => <TypeButton key={type} type={type} database={db.database} tabManager={this.props.tabManager} size="is-medium" />)
                        ) : (
                            <span className="has-text-grey-light">none</span>
                        )}
                    </div>
                    <div className="buttons">
                        <Button
                            icon="fa-solid fa-plus"
                            text="Create relationship"
                            color=""
                            onClick={() =>
                                this.props.tabManager.add({ prefix: "New relationship" }, "fa-regular fa-square-plus", EPage.Rel, { id: null, database: db.database }, new Date().getTime().toString())
                            }
                        />
                    </div>
                    <br />
                    <br />
                </div>
            </div>
        );
    }
}

export default Start;
