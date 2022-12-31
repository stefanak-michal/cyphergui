import React, { Component } from 'react'
import 'bulma/css/bulma.css'
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
            </>
        )
    }
}

export default App
