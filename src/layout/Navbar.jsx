import React, { Component } from 'react'
import { DbContext } from "../db-context";

 class Navbar extends Component {
    state = {
        open: false
    }

    handleOpen = () => {
        this.setState({
            open: !this.state.open,
        });
    }

    handleLogout = () => {
        if (this.context !== null) {
            this.context.close();
            this.context = null;
        }
        this.props.handleLogout();
    }

    render() {
        return (
            <nav className="navbar" role="navigation" aria-label="main navigation">
                <div className="navbar-brand">
                    <a className="navbar-item" href="https://bulma.io">
                        <img src="https://bulma.io/images/bulma-logo.png" width="112" height="28" />
                    </a>

                    <a role="button" className={'navbar-burger ' + (this.state.open ? 'is-active' : '')} aria-label="menu" aria-expanded="false" data-target="basicNavbar" onClick={this.handleOpen}>
                        <span aria-hidden="true"></span>
                        <span aria-hidden="true"></span>
                        <span aria-hidden="true"></span>
                    </a>
                </div>

                <div id="basicNavbar" className={'navbar-menu ' + (this.state.open ? 'is-active' : '')}>
                    <div className="navbar-start"></div>
                    <div className="navbar-end">
                        <div className="navbar-item">
                            <div className="buttons">
                                <a className="button is-primary" onClick={this.props.handleAddCQL}>
                                    <span className="icon"><i className="fas fa-plus" aria-hidden="true"></i></span>
                                    <strong>CQL</strong>
                                </a>
                                <a className="button is-light" onClick={this.handleLogout}>
                                    Log out
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        )
    }
}

Navbar.contextType = DbContext

export default Navbar
