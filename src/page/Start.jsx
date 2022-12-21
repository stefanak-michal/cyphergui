import React, { Component } from 'react'

import { DbContext } from "../db-context"

class Start extends Component {
    state = {
        labels: [],
        types: []
    }

    componentDidMount() {
        if (!this.session1) {
            this.session1 = this.context.session();
            this.session1
                .run('CALL db.labels()')
                .then(result => {
                    this.setState({ labels: result.records.map(record => record.get('label')) });
                })
                .catch(error => {
                    console.error(error);
                })
                .then(() => {
                    this.session1.close();
                    this.session1 = null;
                });
        }

        if (!this.session2) {
            this.session2 = this.context.session();
            this.session2
                .run('CALL db.relationshipTypes()')
                .then(result => {
                    this.setState({ types: result.records.map(record => record.get('relationshipType')) });
                })
                .catch(error => {
                    console.error(error);
                })
                .then(() => {
                    this.session2.close()
                    this.session2 = null;
                });
        }
    }

    render() {
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
