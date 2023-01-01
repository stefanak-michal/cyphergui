import React, { Component } from 'react'
import {neo4j} from "./db";

export class Input extends Component {
    render() {
        return (
            <div className="field">
                <label className="label">{this.props.label}</label>
                <div className="control">
                    <input
                        className="input"
                        name={this.props.name}
                        type={this.props.type || 'text'}
                        placeholder={this.props.placeholder || ''}
                        onChange={this.props.onChange}
                        defaultValue={this.props.value}
                    />
                </div>
            </div>
        )
    }
}

export class Checkbox extends Component {
    render() {
        const id = 'checkbox-' + new Date().getTime();
        return (
            <div className="field">
                <input
                    id={id}
                    type="checkbox"
                    className={"switch " + (this.props.color || '')}
                    name={this.props.name}
                    onChange={this.props.onChange}
                    defaultChecked={this.props.checked || false}
                    defaultValue={this.props.value || ''}
                />
                <label htmlFor={id}>{this.props.label}</label>
            </div>
        )
    }
}

class PropertyType extends Component {
    constructor(props) {
        super(props);
        this.state = {
            types: ['string', 'integer', 'float', 'bool']
        }
    }

    render() {
        return (
            <div className="select">
                <select value={this.props.selected} onChange={this.props.onTypeChange}>
                    {this.state.types.map(type =>
                        <option key={type}>{type}</option>
                    )}
                </select>
            </div>
        )
    }
}

export class Property extends Component {
    render() {
        if (typeof this.props.value === 'object' && this.props.value.hasOwnProperty('low') && this.props.value.hasOwnProperty('high')) {
            return (
                <>
                    <label className="label">{this.props.name}</label>
                    <div className="field is-grouped">
                        <div className="control is-expanded">
                            <input className="input" type="number" defaultValue={neo4j.integer.toString(this.props.value)} step="1" onChange={this.props.onChange} />
                        </div>
                        <div className="control">
                            <PropertyType selected="integer" onTypeChange={this.props.onTypeChange} />
                        </div>
                    </div>
                </>
            )
        } else if (typeof this.props.value === 'string') {
            return (
                <>
                    <label className="label">{this.props.name}</label>
                    <div className="field is-grouped">
                        <div className="control is-expanded">
                            <textarea className="textarea" rows="1" defaultValue={this.props.value} onChange={this.props.onChange} />
                        </div>
                        <div className="control">
                            <PropertyType selected="string" onTypeChange={this.props.onTypeChange} />
                        </div>
                    </div>
                </>
            )
        } else if (typeof this.props.value === 'boolean') {
            return (
                <div className="field is-grouped">
                    <div className="control is-expanded">
                        <div className="field">
                            <input id={"switch-" + this.props.name} type="checkbox" className="switch is-success" defaultChecked={this.props.value} onChange={this.props.onChange} />
                            <label className="has-text-weight-bold" htmlFor={"switch-" + this.props.name}>{this.props.name}</label>
                        </div>
                    </div>
                    <div className="control">
                        <PropertyType selected="bool" onTypeChange={this.props.onTypeChange} />
                    </div>
                </div>
            )
        } else if (typeof this.props.value === 'number') {
            return (
                <>
                    <label className="label">{this.props.name}</label>
                    <div className="field is-grouped">
                        <div className="control is-expanded">
                            <input className="input" type="number" defaultValue={this.props.value} onChange={this.props.onChange} />
                        </div>
                        <div className="control">
                            <PropertyType selected="float" onTypeChange={this.props.onTypeChange} />
                        </div>
                    </div>
                </>
            )
        }
    }
}
