import React, { Component } from 'react'
import './Login.css'

import { Input } from '../bulma'
const neo4j = require('neo4j-driver')

export default class Login extends Component {
    state = {
        url: '',
        username: '',
        password: ''
    }
//todo is-loading on btn on click
    handleSubmit = (event) => {
        event.preventDefault();
        this.props.app.db = neo4j.driver(
            this.state.url,
            neo4j.auth.basic(this.state.username, this.state.password)
        )

        this.props.app.setState({
            logged: true
        })
    }

    handleInputChange = (event) => {
        event.preventDefault();
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;

        this.setState({
            [name]: value
        });
    }

    render() {
        return (
            <section className='mt-5'>
                <div className='container is-fluid'>
                    <h1 className='title has-text-centered'>Bolt Admin</h1>
                    <form id="login" className="columns mt-6" onSubmit={this.handleSubmit}>
                        <div className="column is-one-third is-offset-one-third">
                            <Input label='URL' name='url' onChange={this.handleInputChange} value='bolt://localhost:7687' />
                            <Input label='Username' name='username' onChange={this.handleInputChange} />
                            <Input label='Password' name='password' type='password' onChange={this.handleInputChange} />
                            <button className="button is-primary">Login</button>
                        </div>
                    </form>
                </div>
            </section>
        )
    }
}
