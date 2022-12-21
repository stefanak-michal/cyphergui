import React, { Component } from 'react'

import 'bulma/css/bulma.css'
import './App.css'

import { DbContext } from "./db-context"

import Navbar from './layout/Navbar'
import Tab from './layout/Tab'

import Login from './page/Login'
import Start from './page/Start'
import Query from "./page/Query";

export default class App extends Component {
    state = {
        logged: false,
        activeTab: 'Start',
        tabs: [
            { title: 'Start', icon: 'fas fa-play' }
        ]
    }

    contents = {
        Start: { component: Start, props: {} }
    }

    db = null;

    addTab = (title, icon, component, props, active = false) => {
        this.contents[title] = { component: component, props: props };
        let data = { tabs: this.state.tabs.concat({ title: title, icon: icon }) };
        if (active) {
            data.activeTab = title;
        }
        this.setState(data);
    }

    setActiveTab = (title) => {
        this.setState({
            activeTab: title
        });
    }

    handleAddCQL = () => {
        const i = this.state.tabs.filter(tab => tab.title.indexOf('CQL') === 0).length + 1;
        this.addTab('CQL#' + i, null, Query, {}, true);
    }

    handleLogout = () => {
        this.setState({
            logged: false
        });
    }

    setDB = (driver) => {
        this.db = driver;
        this.setState({ logged: true });
    }

    render() {
        if (this.state.logged) {
            const tabs = this.state.tabs.map(tab =>
                <Tab key={'tab-' + tab.title} {...tab} active={tab.title === this.state.activeTab} handleClick={this.setActiveTab} />
            )

            const content = this.contents[this.state.activeTab];
            const MyComponent = content.component;

            return (
                <DbContext.Provider value={this.db}>
                    <Navbar handleLogout={this.handleLogout} handleAddCQL={this.handleAddCQL} />
                    <section className="tabs is-boxed">
                        <ul>{tabs}</ul>
                    </section>
                    <section className="content container is-fluid">
                        <MyComponent key={'content-' + this.state.activeTab} {...content.props} />
                    </section>
                </DbContext.Provider>
            )
        } else {
            return (
                <Login setDB={this.setDB} />
            )
        }
    }
}
