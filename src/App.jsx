import React, { Component } from 'react'

import 'bulma/css/bulma.css'
import './App.css'

import Navbar from './layout/Navbar'
import Tab from './layout/Tab'

import Login from './page/Login'
import Start from './page/Start'
import Query from './page/Query'

class App extends Component {
    state = {
        logged: false,
        activeTab: 'Start',
        tabs: [
            { title: 'Start', icon: 'fas fa-play' }
        ]
    }

    contents = {
        'Start': <Start app={this} />,
        'CQL': () => {
            const i = this.state.tabs.filter(tab => tab.title.indexOf('CQL') === 0).length + 1;
            this.addTab({ title: 'CQL#' + i, icon: null }, <Query />, true);
        }
    }

    addTab(tab, content, active = false) {
        this.contents[tab.title] = content;
        let data = { tabs: this.state.tabs.concat(tab) };
        if (active) {
            data.activeTab = tab.title;
        }
        this.setState(data);
    }

    setActiveTab(title) {
        if (typeof this.contents[title] === 'function') {
            this.contents[title]();
        } else {
            this.setState({
                activeTab: title,
            });
        }
    }

    render() {
        if (this.state.logged) {
            const tabs = this.state.tabs.map((tab, index) =>
                <Tab key={index} {...tab} app={this} active={tab.title === this.state.activeTab} />
            )
            tabs.push(<Tab key={tabs.length} title="CQL" app={this} icon="fas fa-plus" />);
            return (
                <>
                    <Navbar />
                    <section className="tabs is-boxed">
                        <ul>{tabs}</ul>
                    </section>
                    <section className="content">{this.contents[this.state.activeTab]}</section>
                </>
            )
        } else {
            return (
                <Login app={this} />
            )
        }
    }
}

export default App
