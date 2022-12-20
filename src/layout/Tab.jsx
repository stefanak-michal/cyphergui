import React, { Component } from 'react'

export default class Tab extends Component {
    handleClick = (e) => {
        e.preventDefault();
        this.props.app.setActiveTab(this.props.title);
    }

    render() {
        return (
            <li className={this.props.active ? 'is-active' : ''} onClick={this.handleClick}>
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
