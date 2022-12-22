import React, { Component } from 'react'
import { Input } from './bulma'
import { neo4j, setDriver } from './db'

export default class Login extends Component {
    state = {
        url: 'bolt://localhost:7687',
        username: '',
        password: '',
        submitted: false,
        error: null
    }

    handleSubmit = async (event) => {
        event.preventDefault();
        this.setState({ submitted: true });

        try {
            let driver = neo4j.driver(
                this.state.url,
                neo4j.auth.basic(this.state.username, this.state.password),
                { userAgent: 'bolt-admin' }
            );

            //there is no better way how to verify credentials than running a first query?
            let session = driver.session();
            await session.run('RETURN 1 as num');
            await session.close();

            setDriver(driver);
            this.props.handleLogin();
        } catch (err) {
            console.log(err);
            this.setState({
                submitted: false,
                error: '[' + err.name + '] ' + err.message
            });
        }
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

    componentDidMount() {
        this.setState({
            submitted: false,
            error: null
        });
    }

    render() {
        return (
            <section className='mt-5'>
                <div className='container is-fluid'>
                    <h1 className='title has-text-centered'>Bolt Admin</h1>
                    <form id="login" className="columns mt-6" onSubmit={this.handleSubmit}>
                        <div className="column is-one-third is-offset-one-third">
                            <Input label='URL' name='url' onChange={this.handleInputChange} value={this.state.url} />
                            <Input label='Username' name='username' onChange={this.handleInputChange} value={this.state.username} />
                            <Input label='Password' name='password' type='password' onChange={this.handleInputChange} />

                            {this.state.error &&
                                <div className="notification is-danger">
                                    {this.state.error}
                                </div>
                            }

                            <button className={"button is-primary " + (this.state.submitted ? 'is-loading' : '')}>
                                Login
                            </button>
                        </div>
                    </form>
                </div>
            </section>
        )
    }
}
