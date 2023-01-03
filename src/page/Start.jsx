import React, { Component } from "react";
import { neo4j, getActiveDb, getDriver, registerChangeDbCallback } from "../db";
import { Button } from "../form";

class Start extends Component {
    constructor(props) {
        super(props);
        this.state = {
            labels: [],
            types: [],
            serverInfo: {},
        };
    }

    componentDidMount() {
        registerChangeDbCallback(this.requestData);
        this.requestData();
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        if (nextProps.active && this.props.active !== nextProps.active) {
            this.requestData();
        }
        return true;
    }

    requestData = () => {
        Promise.all([
            getDriver().session({ database: getActiveDb(), defaultAccessMode: neo4j.session.READ }).run("MATCH (n) WITH DISTINCT labels(n) AS ll UNWIND ll AS l RETURN collect(DISTINCT l) AS c"),
            getDriver().session({ database: getActiveDb(), defaultAccessMode: neo4j.session.READ }).run("MATCH ()-[n]-() RETURN collect(DISTINCT type(n)) AS c"),
            getDriver().getServerInfo(),
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
        if (!this.props.active) return;
        document.title = "Start (db: " + getActiveDb() + ")";

        return (
            <>
                <div className="subtitle mb-2">Server</div>
                {Object.keys(this.state.serverInfo).length ? (
                    <div>
                        Connected to <b>{this.state.serverInfo.address}</b> with protocol version <b>{this.state.serverInfo.protocolVersion}</b>.
                    </div>
                ) : (
                    <div>Loading ...</div>
                )}
                <br />
                <div className="subtitle mb-2">Node labels</div>
                <div className="buttons">
                    {this.state.labels.length > 0 ? (
                        this.state.labels.map(label => (
                            <Button
                                color="tag is-link is-rounded is-medium px-3"
                                onClick={() => this.props.addTab(label, "fa-regular fa-circle", "label", { label: label, database: getActiveDb() })}
                                key={label}
                                text={label}
                            />
                        ))
                    ) : (
                        <span className="has-text-grey-light">none</span>
                    )}
                </div>
                <br />
                <div className="subtitle mb-2">Relationship types</div>
                <div className="buttons">
                    {this.state.types.length > 0 ? (
                        this.state.types.map(type => (
                            <Button
                                color="tag is-info is-rounded is-medium px-3"
                                onClick={() => this.props.addTab(type, "fa-solid fa-arrow-right-long", "type", { type: type, database: getActiveDb() })}
                                key={type}
                                text={type}
                            />
                        ))
                    ) : (
                        <span className="has-text-grey-light">none</span>
                    )}
                </div>
                <br />
                some additional buttons?
            </>
        );
    }
}

export default Start;
