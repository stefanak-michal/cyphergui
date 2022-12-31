import { Component } from "react";
import Tab from "./layout/Tab";
import Navbar from "./layout/Navbar";
import Start from "./page/Start";
import Query from "./page/Query";

/**
 * Logged page with tab management
 */
export default class Logged extends Component {
    state = {
        activeTab: null,
        tabs: [],
        contents: [],
        toasts: []
    }

    toastInterval = null;

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

        this.toastInterval = setInterval(() => {
            if (this.state.toasts.length > 0) {
                let t = this.state.toasts;
                for (let i = this.state.toasts.length - 1; i >= 0; i--) {
                    if (t[i].timeout > 0) {
                        t[i].timeout--;
                    } else {
                        t.splice(i, 1);
                    }
                }
                this.setState({
                    toasts: t
                })
            }
        }, 1000);
    }

    componentWillUnmount() {
        if (this.toastInterval !== null) {
            clearInterval(this.toastInterval);
        }
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

    handleAddCQL = () => {
        let j = Math.max(...this.state.tabs.map(tab => /Query#\d+/.test(tab.title)
            ? parseInt(tab.title.match(/Query#(\d+)/)[1])
            : 0)) + 1;
        this.addTab('Query#' + j, 'fa-solid fa-terminal', Query, {});
    }

    removeTab = (title, e) => {
        e.stopPropagation();
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

    toast = (message, color = 'is-success', timeout = 3) => {
        this.setState({
            toasts: this.state.toasts.concat({ message: message, color: color, timeout: timeout })
        })
    }

    render() {
        if (this.state.tabs.length === 0 || this.state.activeTab === null) return

        return (
            <>
                <Navbar handleLogout={this.props.handleLogout} handleAddCQL={this.handleAddCQL} />
                <section className="tabs is-boxed">
                    <ul>{this.state.tabs.map(tab =>
                        <Tab key={'tab-' + tab.title} {...tab} active={tab.title === this.state.activeTab} handleClick={this.setActiveTab} handleRemove={this.removeTab} />
                    )}</ul>
                </section>
                <section className="container is-fluid">
                    {this.state.contents.map(content => {
                        const MyComponent = content.component;
                        return <MyComponent key={'content-' + content.title} {...content.props} active={content.title === this.state.activeTab} addTab={this.addTab} toast={this.toast} />
                    })}
                </section>
                <section className="notifications">
                    {this.state.toasts.map((toast, index) =>
                        <div className={"notification " + toast.color}>
                            {toast.message}
                        </div>
                    )}
                </section>
            </>
        )
    }
}
