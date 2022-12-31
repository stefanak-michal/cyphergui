import React, { Component } from "react";
import Tab from "./layout/Tab";
import Navbar from "./layout/Navbar";
import Start from "./page/Start";
import Query from "./page/Query";

/**
 * Logged page with tab management
 */
class Logged extends Component {
    constructor(props) {
        super(props);
        this.state = {
            activeTab: null,
            tabs: [],
            contents: [],
            toasts: []
        }
    }

    componentDidMount() {
        this.setState({
            activeTab: 'Start',
            tabs: [
                { title: 'Start', icon: 'fa-solid fa-play' }
            ],
            contents: [
                { title: 'Start', component: Start, props: {} }
            ]
        });
    }

    addTab = (title, icon, component, props, active = true) => {
        if (this.state.tabs.filter(value => value.title === title).length) {
            this.setActiveTab(title);
            return;
        }

        let data = {
            tabs: this.state.tabs.concat({ title: title, icon: icon }),
            contents: this.state.contents.concat({ title: title, component: component, props: props })
        };
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

    removeTab = (title, e) => {
        !!e && e.stopPropagation();
        let data = {
            tabs: this.state.tabs.filter(tab => title !== tab.title),
            contents: this.state.contents.filter(content => title !== content.title)
        };

        if (this.state.activeTab === title) {
            let i = this.state.tabs.map(tab => tab.title).indexOf(title);
            data.activeTab = this.state.tabs[i - 1].title;
        }

        this.setState(data);
    }

    handleAddQueryTab = () => {
        let j = Math.max(...this.state.tabs.map(tab => /Query#\d+/.test(tab.title)
            ? parseInt(tab.title.match(/Query#(\d+)/)[1])
            : 0)) + 1;
        this.addTab('Query#' + j, 'fa-solid fa-terminal', Query, {});
    }

    toast = (message, color = 'is-success', delay = 3) => {
        const i = new Date().getTime();
        this.setState({
            toasts: this.state.toasts.concat({
                key: i,
                message: message,
                color: color,
                delay: delay,
                timeout: setTimeout(() => this.discardToast(i), delay * 1000)
            })
        })
    }

    discardToast = (i) => {
        this.setState({
            toasts: this.state.toasts.filter(t => t.key !== i)
        })
    }

    render() {
        if (this.state.tabs.length === 0 || this.state.activeTab === null) return

        return (
            <>
                <Navbar handleLogout={this.props.handleLogout} handleAddQueryTab={this.handleAddQueryTab} />
                <section className="tabs is-boxed">
                    <ul>{this.state.tabs.map(tab =>
                        <Tab key={'tab-' + tab.title} {...tab} active={tab.title === this.state.activeTab} handleClick={this.setActiveTab} handleRemove={this.removeTab} />
                    )}</ul>
                </section>
                <section className="container is-fluid">
                    {this.state.contents.map(content => {
                        const MyComponent = content.component;
                        return <MyComponent
                            key={'content-' + content.title}
                            {...content.props}
                            active={content.title === this.state.activeTab}
                            addTab={this.addTab}
                            removeTab={this.removeTab}
                            toast={this.toast}
                        />
                    })}
                </section>
                <section className="notifications">
                    {this.state.toasts.map(toast =>
                        <div className={"notification fadeOut " + toast.color} style={{ animationDelay: (toast.delay - 1) + 's' }}>
                            <button className="delete" onClick={() => this.discardToast(toast.key)}></button>
                            {toast.message}
                        </div>
                    )}
                </section>
                <footer className="footer mt-6">
                    <div className="content has-text-centered">
                        <b>Bolt-Admin</b> by Michal Stefanak.<br/>
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

export default Logged
