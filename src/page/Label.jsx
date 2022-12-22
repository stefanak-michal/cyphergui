import React, { Component } from 'react'
import Pagination from "./block/Pagination";
import { neo4j, getDriver } from '../db'

/**
 * List all nodes with specific label
 * @todo add events to actions in td row
 * @todo test additional labels and add buttons
 * @todo put toggle somewhere to switch between table and graph
 */
export default class Label extends Component {
    perPage = 20

    state = {
        rows: [],
        page: 1,
        total: 0
    }

    requestData = () => {
        Promise
            .all([
                getDriver()
                    .session()
                    .run('MATCH (n:' + this.props.label + ') RETURN n SKIP $s LIMIT $l', {
                        s: neo4j.int((this.state.page - 1) * this.perPage),
                        l: neo4j.int(this.perPage)
                    }),
                getDriver()
                    .session()
                    .run('MATCH (n:' + this.props.label + ') RETURN COUNT(n) AS cnt')
            ])
            .then(responses => {
                this.setState({
                    rows: responses[0].records.map(record => record.get('n')),
                    total: responses[1].records[0].get('cnt')
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

    handleChangePage = (page) => {
        this.setState({
            page: page
        }, this.requestData);
    }

    render() {
        if (!this.props.active) return;

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
                <div className="mb-3">
                    <span className="icon-text is-flex-wrap-nowrap">
                        <span className="icon"><i className="fa-solid fa-terminal" aria-hidden="true"></i></span>
                        <span className="is-family-code">
                            {'MATCH (n:' + this.props.label + ') RETURN n SKIP ' + ((this.state.page - 1) * this.perPage) + ' LIMIT ' + this.perPage}
                        </span>
                    </span>
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
                                    <td className="nowrap">{row.elementId}</td>
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
                                <td className="nowrap">
                                    <span className="icon" title="Show relationships">
                                        <i className="fa-solid fa-circle-nodes"></i>
                                    </span>
                                    <span className="icon" title="Edit">
                                        <i className="fa-solid fa-pen-clip"></i>
                                    </span>
                                    <span className="icon" title="Delete">
                                        <i className="fa-solid fa-trash-can"></i>
                                    </span>
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                <Pagination page={this.state.page} pages={Math.ceil(this.state.total / this.perPage)} action={this.handleChangePage} />
            </>
        )
    }
}
