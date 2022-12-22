import { Component } from "react";
import Tab from "./layout/Tab";
import Navbar from "./layout/Navbar";
import Start from "./page/Start";
import Query from "./page/Query";

export default class Logged extends Component {
    state = {
        activeTab: null,
        tabs: []
    }

    componentDidMount() {
        this.setState({
            activeTab: 'Start',
            tabs: [
                { title: 'Start', icon: 'fa-solid fa-play' }
            ]
        })

        this.contents = [
            { title: 'Start', component: Start, props: { } }
        ]
    }

    addTab = (title, icon, component, props, active = true) => {
        if (this.state.tabs.filter(value => value.title === title).length) {
            this.setActiveTab(title);
            return;
        }

        this.contents.push({ title: title, component: component, props: props });
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
        this.addTab('CQL#' + i, 'fa-solid fa-terminal', Query, {});
    }

    render() {
        if (this.state.tabs.length === 0 || this.state.activeTab === null) return

        return (
            <>
                <Navbar handleLogout={this.props.handleLogout} handleAddCQL={this.handleAddCQL} />
                <section className="tabs is-boxed">
                    <ul>{this.state.tabs.map(tab =>
                        <Tab key={'tab-' + tab.title} {...tab} active={tab.title === this.state.activeTab} handleClick={this.setActiveTab} />
                    )}</ul>
                </section>
                <section className="container is-fluid">
                    {this.contents.map(content => {
                        const MyComponent = content.component;
                        return <MyComponent key={'content-' + content.title} {...content.props} active={content.title === this.state.activeTab} addTab={this.addTab} />
                    })}
                </section>
            </>
        )
    }
}
