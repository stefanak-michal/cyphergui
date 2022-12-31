import React, { Component } from 'react'
import Label from "./Label";
import Type from "./Type";
import { getDriver } from '../db'

export default class Start extends Component {
    state = {
        labels: [],
        types: [],
        serverInfo: {}
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        if (nextProps.active && this.props.active !== nextProps.active) {
            this.requestData();
        }
        return true;
    }

    requestData = () => {
        Promise
            .all([
                getDriver()
                    .session()
                    .run('MATCH (n) WITH DISTINCT labels(n) AS ll UNWIND ll AS l RETURN collect(DISTINCT l) AS c'),
                getDriver()
                    .session()
                    .run('MATCH ()-[n]-() RETURN collect(DISTINCT type(n)) AS c'),
                getDriver()
                    .getServerInfo()
            ])
            .then(responses => {
                this.setState({
                    labels: responses[0].records[0].get('c'),
                    types: responses[1].records[0].get('c'),
                    serverInfo: responses[2]
                });
            })
            .catch(error => {
                console.error(error);
            })
    }

    componentDidMount() {
        this.requestData();
    }

    render() {
        if (!this.props.active) return;
        return (
            <>
                <div className="subtitle mb-2">Server</div>
                {Object.keys(this.state.serverInfo).length
                    ? <div>Connected to <b>{this.state.serverInfo.address}</b> with protocol version <b>{this.state.serverInfo.protocolVersion}</b>.</div>
                    : <div>Loading ...</div>
                }
                <br />

                <div className="subtitle mb-2">Node labels</div>
                <div className="buttons are-small">
                    {this.state.labels.map(label =>
                        <button className="button is-link is-rounded"
                                onClick={() => this.props.addTab(label, 'fa-regular fa-circle', Label, { label: label })}
                                key={label}>{label}</button>
                    )}
                </div>

                <br />

                <div className="subtitle mb-2">Relationship types</div>
                <div className="buttons are-small">
                    {this.state.types.map(type =>
                        <button className="button is-info is-rounded"
                                onClick={() => this.props.addTab(type, 'fa-solid fa-arrow-right-long', Type, { type: type })}
                                key={type}>{type}</button>
                    )}
                </div>

                <br />

                some additional buttons?
            </>
        )
    }
}
