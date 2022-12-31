import React, { Component } from 'react'
import Pagination from "./block/Pagination";
import Modal from "./block/Modal";
import { neo4j, getDriver } from '../db'
import { Checkbox } from "../bulma";

/**
 * List all nodes with specific label
 * @todo add events to actions in td row
 * @todo test additional labels and add buttons
 * @todo put toggle somewhere to switch between table and graph
 */
export default class Label extends Component {
    perPage = 20
    hasElementId = false;

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
                this.hasElementId = responses[0].records.length > 0 && !!responses[0].records[0].get('n').elementId;
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

    handleOpenDeleteModal = (id) => {
        this.setState({
            delete: { id: id }
        })
    }

    handleDeleteModalConfirm = () => {
        getDriver()
            .session()
            .run('MATCH (n) WHERE ' + (this.hasElementId ? 'elementId(n)' : 'id(n)') + ' = $i ' + (this.state.delete.detach ? 'DETACH ' : '') + 'DELETE n', {
                i: this.state.delete.id
            })
            .then(() => {
                this.requestData();
                this.props.toast('Node deleted');
            })
            .catch(error => {
                this.setState({
                    error: error.message
                })
            })
            .finally(() => {
                this.handleDeleteModalCancel();
            })
    }

    handleDeleteModalCancel = () => {
        this.setState({
            delete: null
        })
    }

    handleDeleteModalDetachCheckbox = (e) => {
        this.setState({
            delete: { ...this.state.delete, detach: e.target.checked }
        })
    }

    handleClearError = () => {
        this.setState({
            error: null
        })
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
                {this.state.delete &&
                    <Modal title="Are you sure?" color="is-danger" handleClose={this.handleDeleteModalCancel}>
                        <div className="mb-3">
                            <Checkbox name="detachDelete" onChange={this.handleDeleteModalDetachCheckbox} label="Detach delete?" checked={this.state.delete.detach} />
                        </div>
                        <div className="buttons is-justify-content-flex-end">
                            <button className="button is-danger" onClick={this.handleDeleteModalConfirm}>Confirm</button>
                            <button className="button is-secondary" onClick={this.handleDeleteModalCancel}>Cancel</button>
                        </div>
                    </Modal>
                }

                {this.state.error &&
                    <div className="message is-danger">
                        <div className="message-header">
                            <p>Error</p>
                            <button className="delete" aria-label="delete" onClick={this.handleClearError}></button>
                        </div>
                        <div className="message-body">
                            {this.state.error}
                        </div>
                    </div>
                }

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
                            <th rowSpan="2"></th>
                            <th rowSpan="2">ID</th>
                            {this.hasElementId &&
                                <th rowSpan="2">elementId</th>
                            }
                            <th rowSpan="2"><abbr title={"Additional node labels besides :" + this.props.label}>labels</abbr></th>
                            <th colSpan={keys.length}>properties</th>
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
                                <td>
                                    <div className="is-flex-wrap-nowrap buttons">
                                        <button className="button">
                                        <span className="icon is-small" title="Show relationships">
                                            <i className="fa-solid fa-circle-nodes"></i>
                                        </span>
                                        </button>
                                        <button className="button">
                                        <span className="icon is-small" title="Edit">
                                            <i className="fa-solid fa-pen-clip"></i>
                                        </span>
                                        </button>
                                        <button className="button" onClick={() => this.handleOpenDeleteModal(this.hasElementId ? row.elementId : row.identity)}>
                                        <span className="icon is-small" title="Delete">
                                            <i className="fa-solid fa-trash-can"></i>
                                        </span>
                                        </button>
                                    </div>
                                </td>
                                <td>{neo4j.integer.toString(row.identity)}</td>
                                {this.hasElementId &&
                                    <td className="nowrap">{row.elementId}</td>
                                }
                                <td>{row.labels.filter(value => value !== this.props.label).join(', ')}</td>
                                {keys.map(key => <td>
                                        {row.properties.hasOwnProperty(key) && (
                                            row.properties[key].hasOwnProperty('low') && row.properties[key].hasOwnProperty('high')
                                                ? neo4j.integer.toString(row.properties[key])
                                                : row.properties[key].toString()
                                        )}
                                    </td>
                                )}
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
