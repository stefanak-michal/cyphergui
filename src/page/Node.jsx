import React, { Component } from "react";
import { neo4j, getDriver } from "../db";
import Label from "./Label";
import {Property} from "../form";

/**
 * Edit node by ID
 * @todo
 */
class Node extends Component {

    constructor(props) {
        super(props);
        this.state = {
            data: null
        }
    }

    requestData = () => {
        getDriver()
            .session({ database: this.props.database, defaultAccessMode: neo4j.session.READ })
            .run('MATCH (n) WHERE id(n) = $i RETURN n', {
                i: this.props.id
            })
            .then(response => {
                console.log(response.records[0].get('n'));
                this.setState({
                    data: response.records[0].get('n')
                });
            })
            .catch(error => {
                console.error(error);
            });
    }

    componentDidMount() {
        this.requestData();
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        if (nextProps.active && this.props.active !== nextProps.active) {
            this.requestData();
        }
        return true;
    }

    handlePropertyChange = () => {

    }

    handlePropertyTypeChange = () => {

    }

    render() {
        if (!this.props.active) return
        document.title = 'Node #' + this.props.id + ' (db: ' + this.props.database + ')';

        if (this.state.data === null) {
            return (
                <span className="has-text-grey-light">Loading...</span>
            )
        }

        return (
            <>
                <div className="columns">
                    <div className="column is-half-desktop">
                        <div className="field">
                            <label className="label">identity</label>
                            <div className="control">
                                <input className="input" disabled type="text" defaultValue={neo4j.integer.toString(this.state.data.identity)} />
                            </div>
                        </div>
                    </div>
                    <div className="column is-half-desktop">
                        {!!this.state.data.elementId &&
                         <div className="field">
                             <label className="label">elementId</label>
                             <div className="control">
                                 <input className="input" disabled type="text" defaultValue={this.state.data.elementId} />
                             </div>
                         </div>
                        }
                    </div>
                </div>

                <div className="field mb-6">
                    <label className="label">Labels @todo add new</label>
                    <div className="control buttons are-small">
                        {this.state.data.labels.map(label =>
                            <div className="tags has-addons">
                                <a className="tag is-link" onClick={() => this.props.addTab(label, 'fa-regular fa-circle', Label, { label: label, database: this.props.database })}>{label}</a>
                                <a className="tag is-delete" onClick={() => window.alert('todo, just make it grey and remove on save')}></a>
                            </div>
                        )}
                    </div>
                </div>

                <fieldset className="box">
                    <legend className="tag is-dark">Properties</legend>
                    {Object.keys(this.state.data.properties).sort().map(key =>
                        <Property key={key} name={key} value={this.state.data.properties[key]} onChange={this.handlePropertyChange} onTypeChange={this.handlePropertyTypeChange} />
                    )}
                </fieldset>

                <div className="field">
                    <div className="control has-text-right">
                        <button className="button is-success">
                            <span className="icon">
                                <i className="fa-solid fa-check"></i>
                            </span>
                            <span>Submit</span>
                        </button>
                    </div>
                </div>

            </>
        )
    }
}

export default Node
