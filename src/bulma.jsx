import React, { Component } from 'react'

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
        return (
            <div className="field">
                <label className="checkbox">
                    <input
                        type="checkbox"
                        name={this.props.name}
                        onChange={this.props.onChange}
                        checked={this.props.checked || false}
                        value={this.props.value || ''}
                    /> {this.props.label}
                </label>
            </div>
        )
    }
}

// export class Button extends Component {
//     render() {
//         return (
//             <button className="button">Button</button>
//         )
//     }
// }
