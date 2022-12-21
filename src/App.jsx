import React, { Component } from 'react'

import 'bulma/css/bulma.css'
import './App.css'

import Navbar from './layout/Navbar'
import Tab from './layout/Tab'

import Login from './page/Login'
import Start from './page/Start'

export default class App extends Component {
    state = {
        logged: false,
        activeTab: 'Start',
        tabs: [
            { title: 'Start', icon: 'fas fa-play' }
        ]
    }

    contents = {}

    db = null;

    constructor(props) {
        super(props);
        this.contents['Start'] = <Start app={this} />
    }

    addTab = (title, icon, content, active = false) => {
        this.contents[title] = content;
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

    render() {
        if (this.state.logged) {
            const tabs = this.state.tabs.map(tab =>
                <Tab {...tab} active={tab.title === this.state.activeTab} handleClick={this.setActiveTab} />
            )
            return (
                <>
                    <Navbar app={this} />
                    <section className="tabs is-boxed">
                        <ul>{tabs}</ul>
                    </section>
                    <section className="content">
                        {this.contents[this.state.activeTab]}
                    </section>
                </>
            )
        } else {
            return (
                <Login app={this} />
            )
        }
    }
}
