import React, { Component } from 'react'

export default class Tab extends Component {
    render() {
        return (
            <li className={this.props.active ? 'is-active' : ''} onClick={() => this.props.handleClick(this.props.title)}>
                <a>
                    {this.props.icon &&
                        <span className="icon is-small"><i className={this.props.icon} aria-hidden="true"></i></span>
                    }
                    <span>{this.props.title}</span>
                </a>
            </li>
        )
    }
}
