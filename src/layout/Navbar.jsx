import React, { Component } from 'react'
// import './Content.css'

export default class Navbar extends Component {
    state = {
        open: false,
        burgerClassName: 'navbar-burger',
        menuClassName: 'navbar-menu'
    }

    handleOpen = (e) => {
        e.preventDefault();
        if (this.state.open) {
            this.setState({
                open: false,
                burgerClassName: 'navbar-burger',
                menuClassName: 'navbar-menu'
            });
        } else {
            this.setState({
                open: true,
                burgerClassName: 'navbar-burger is-active',
                menuClassName: 'navbar-menu is-active'
            });
        }
    }

    render() {
        return (
            <nav className="navbar" role="navigation" aria-label="main navigation">
                <div className="navbar-brand">
                    <a className="navbar-item" href="https://bulma.io">
                        <img src="https://bulma.io/images/bulma-logo.png" width="112" height="28" />
                    </a>

                    <a role="button" className={this.state.burgerClassName} aria-label="menu" aria-expanded="false" data-target="basicNavbar" onClick={this.handleOpen}>
                        <span aria-hidden="true"></span>
                        <span aria-hidden="true"></span>
                        <span aria-hidden="true"></span>
                    </a>
                </div>

                <div id="basicNavbar" className={this.state.menuClassName}>
                    <div className="navbar-start"></div>
                    <div className="navbar-end">
                        <div className="navbar-item">
                            <div className="buttons">
                                {/* <a className="button is-primary">
                                    <strong>+ Query</strong>
                                </a> */}
                                <a className="button is-light">
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
