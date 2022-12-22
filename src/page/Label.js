import React, { Component } from 'react'
import Pagination from "./block/Pagination";
import { neo4j, getDriver } from '../db'

export default class Label extends Component {
    perPage = 20

    state = {
        rows: [],
        page: 1,
        total: 0
    }

    requestData = () => {
        getDriver().session()
            .run('MATCH (n:' + this.props.label + ') RETURN n SKIP $s LIMIT $l', { s: neo4j.int((this.state.page - 1) * this.perPage), l: neo4j.int(this.perPage) })
            .then(result => {
                this.setState({
                    rows: result.records.map(record => record.get('n'))
                });
            })
            .catch(error => {
                console.error(error);
            })

        getDriver().session()
            .run('MATCH (n:' + this.props.label + ') RETURN COUNT(n) AS cnt')
            .then(result => {
                this.setState({
                    total: result.records[0].get('cnt')
                });
            })
            .catch(error => {
                console.error(error);
            })
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

    render() {
        if (!this.props.active) return;

        // console.log(this.state.rows);
        let keys = [];
        for (let row of this.state.rows) {
            for (let k in row.properties) {
                if (keys.indexOf(k) === -1) {
                    keys.push(k);
                }
            }
        }

        return (
            <>
                <div>
                    Query:
                    <div className="control">
                        <textarea className="textarea is-family-code" readOnly defaultValue="This content is readonly" rows="1" />
                        button - edit query ..opens new Query tab
                    </div>
                </div>
                <div className="table-container">
                    <table className="table is-bordered is-striped is-narrow is-hoverable">
                        <thead>
                        <tr>
                            <th rowSpan="2">ID</th>
                            {this.state.rows.length && !!this.state.rows[0].elementId &&
                                <th rowSpan="2">elementId</th>
                            }
                            <th colSpan={keys.length}>properties</th>
                            <th rowSpan="2"><abbr title={"Additional node labels besides :" + this.props.label}>labels</abbr></th>
                            <th rowSpan="2"></th>
                        </tr>
                        <tr>
                            {keys.map(key =>
                                <th>{key}</th>
                            )}
                        </tr>
                        </thead>
                        <tbody>
                        {this.state.rows.map(row =>
                            <tr>
                                <td>{neo4j.integer.toString(row.identity)}</td>
                                {this.state.rows.length && !!this.state.rows[0].elementId &&
                                    <td>{row.elementId}</td>
                                }
                                {keys.map(key => <td>
                                        {row.properties.hasOwnProperty(key) && (
                                            row.properties[key].hasOwnProperty('low') && row.properties[key].hasOwnProperty('high')
                                                ? neo4j.integer.toString(row.properties[key])
                                                : row.properties[key].toString()
                                        )}
                                    </td>
                                )}
                                <td>{row.labels.filter(value => value !== this.props.label).join(', ')}</td>
                                <td>actions</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                <Pagination page={this.state.page} pages={Math.ceil(this.state.total / this.perPage)} />
            </>

            //todo test additional labels and add buttons
            //todo put toggle somewhere to switch between table and graph
        )
    }
}
