import * as React from "react";
import Tab from "./layout/Tab";
import Navbar from "./layout/Navbar";
import Start from "./page/Start";
import Query from "./page/Query";
import Node from "./page/Node";
import Label from "./page/Label";
import Type from "./page/Type";
import Relationship from "./page/Relationship";

type DataType = {
    tabs: { title: string; icon: string | null }[];
    contents: { title: string; component: string; props: object }[];
    activeTab?: string;
};

/**
 * Logged page with tab management
 */
class Logged extends React.Component<{ handleLogout: () => void }> {
    state = {
        activeTab: null,
        tabs: [],
        contents: [],
        toasts: [],
    };

    components = {
        start: Start,
        query: Query,
        node: Node,
        label: Label,
        type: Type,
        rel: Relationship,
    };

    componentDidMount() {
        this.setState({
            activeTab: "Start",
            tabs: [{ title: "Start", icon: "fa-solid fa-play" }],
            contents: [{ title: "Start", component: "start", props: {} }],
        });
    }

    /**
     * Tab title has to be unique ..if already exists is switched on it
     */
    addTab = (title: string, icon: string | null, component: string, props: object = {}, active: boolean = true) => {
        if (this.state.tabs.filter(value => value.title === title).length) {
            this.setActiveTab(title);
            return;
        }

        //open new tab next to current active tab
        const i: number = this.state.tabs.findIndex(t => t.title === this.state.activeTab);
        let tabs = [...this.state.tabs];
        if (i !== -1) tabs.splice(i + 1, 0, { title: title, icon: icon });
        else tabs.push({ title: title, icon: icon });

        let data: DataType = {
            tabs: tabs,
            contents: this.state.contents.concat({ title: title, component: component, props: props }),
        };
        if (active) {
            data.activeTab = title;
        }
        this.setState(data);
    };

    /**
     * Create tab name with requested prefix and calculated index
     */
    generateTabName = (prefix: string) => {
        const i: number = Math.max(0, ...this.state.tabs.filter(t => t.title.indexOf(prefix) === 0).map(t => parseInt(t.title.split("#")[1]))) + 1;
        return prefix + "#" + i;
    };

    setActiveTab = (title: string) => {
        this.setState({
            activeTab: title,
        });
    };

    removeTab = (title: string, e?: React.PointerEvent) => {
        !!e && e.stopPropagation();
        let data: DataType = {
            tabs: this.state.tabs.filter(tab => title !== tab.title),
            contents: this.state.contents.filter(content => title !== content.title),
        };

        if (this.state.activeTab === title) {
            let i: number = this.state.tabs.map(tab => tab.title).indexOf(title);
            data.activeTab = this.state.tabs[i - 1].title;
        }

        this.setState(data);
    };

    toast = (message, color = "is-success", delay = 3) => {
        const i: number = new Date().getTime();
        this.setState({
            toasts: this.state.toasts.concat({
                key: i,
                message: message,
                color: color,
                delay: delay,
                timeout: setTimeout(() => this.discardToast(i), delay * 1000),
            }),
        });
    };

    discardToast = (i: number) => {
        this.setState({
            toasts: this.state.toasts.filter(t => t.key !== i),
        });
    };

    render() {
        if (this.state.tabs.length === 0 || this.state.activeTab === null) return;

        return (
            <>
                <Navbar handleLogout={this.props.handleLogout} handleAddQueryTab={() => this.addTab(this.generateTabName("Query"), "fa-solid fa-terminal", "query")} />
                <section className="tabs is-boxed">
                    <ul>
                        {this.state.tabs.map(tab => (
                            <Tab key={"tab-" + tab.title} active={tab.title === this.state.activeTab} handleClick={this.setActiveTab} handleRemove={this.removeTab} {...tab} />
                        ))}
                    </ul>
                </section>
                <section className={"container " + (this.state.activeTab === "Start" ? "" : "is-fluid")}>
                    {this.state.contents.map(content => {
                        const MyComponent: string = this.components[content.component];
                        return (
                            <MyComponent
                                key={"content-" + content.title}
                                active={content.title === this.state.activeTab}
                                tabName={content.title}
                                addTab={this.addTab}
                                removeTab={this.removeTab}
                                generateTabName={this.generateTabName}
                                toast={this.toast}
                                {...content.props}
                            />
                        );
                    })}
                </section>
                <section className="notifications">
                    {this.state.toasts.map(toast => (
                        <div key={toast.key} className={"notification fadeOut " + toast.color} style={{ animationDelay: toast.delay - 1 + "s" }}>
                            <button className="delete" onClick={() => this.discardToast(toast.key)}></button>
                            {toast.message}
                        </div>
                    ))}
                </section>
            </>
        );
    }
}

export default Logged;
