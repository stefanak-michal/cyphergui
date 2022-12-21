import React, { Component } from 'react'
import { DbContext } from "../db-context"

class Start extends Component {
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
        this.context.session()
            .run('CALL db.labels()')
            .then(result => {
                this.setState({ labels: result.records.map(record => record.get('label')) });
            })
            .catch(error => {
                console.error(error);
            })

        this.context.session()
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
                        <button className="button is-link is-rounded">{label}</button>
                    )}
                </div>

                <br />

                <div className="subtitle mb-2">Relationship types</div>
                <div className="buttons are-small">
                    {this.state.types.map(type =>
                        <button className="button is-info is-rounded">{type}</button>
                    )}
                </div>

                <br />

                some additional buttons?
            </>
        )
    }
}

Start.contextType = DbContext

export default Start
