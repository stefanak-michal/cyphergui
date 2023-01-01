import React, { Component } from 'react'
import 'bulma/css/bulma.css'
import 'bulma-switch/dist/css/bulma-switch.min.css'
import './App.css'
import Login from './Login'
import Logged from './Logged'

class App extends Component {
    state = {
        logged: false
    }

    handleLogin = () => {
        this.setState({
            logged: true
        });
    }

    handleLogout = () => {
        this.setState({
            logged: false
        });
    }

    render() {
        return (
            <>
                {this.state.logged
                    ? <Logged handleLogout={this.handleLogout} />
                    : <Login handleLogin={this.handleLogin} />
                }

                <footer className="footer">
                    <div className="content has-text-centered">
                        <b>Bolt-Admin</b> by Michal Stefanak<br/>
                        <a href="https://github.com/stefanak-michal/bolt-admin" target="_blank" className="icon-text">
                            <span className="icon">
                                <i className="fa-brands fa-github"></i>
                            </span>
                            <span>GitHub</span>
                        </a>
                    </div>
                </footer>
            </>
        )
    }
}

export default App
