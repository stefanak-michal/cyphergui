import React, { Component } from 'react'
import Label from "./Label";
import Type from "./Type";
import { getDriver } from '../db'

export default class Start extends Component {
    state = {
        labels: [],
        types: []
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        if (nextProps.active && this.props.active !== nextProps.active) {
            this.requestData();
        }
        return true;
    }

    requestData = () => {
        getDriver().session()
            .run('CALL db.labels()')
            .then(result => {
                this.setState({ labels: result.records.map(record => record.get('label')) });
            })
            .catch(error => {
                console.error(error);
            })

        getDriver().session()
            .run('CALL db.relationshipTypes()')
            .then(result => {
                this.setState({ types: result.records.map(record => record.get('relationshipType')) });
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
                                onClick={() => this.props.addTab(type, 'fa-solid fa-arrows-left-right-to-line', Type, { type: type })}
                                key={type}>{type}</button> //fa-solid fa-link alebo fa-arrows-left-right-to-line
                    )}
                </div>

                <br />

                some additional buttons?
            </>
        )
    }
}
