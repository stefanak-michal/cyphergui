import * as React from "react";
import Tab from "./layout/Tab";
import Navbar from "./layout/Navbar";
import Start from "./page/Start";
import Query from "./page/Query";
import Node from "./page/Node";
import Label from "./page/Label";
import Type from "./page/Type";
import Relationship from "./page/Relationship";
import { EPage } from "./enums";

interface ILoggedState {
    activeTab: string | null;
    tabs: { title: string; icon: string }[];
    contents: { title: string; page: EPage; props: object }[];
    toasts: { key: number; message: string; color: string; delay: number; timeout: NodeJS.Timeout }[];
}

/**
 * Logged page with tab management
 */
class Logged extends React.Component<{ handleLogout: () => void }, ILoggedState> {
    state: ILoggedState = {
        activeTab: null,
        tabs: [],
        contents: [],
        toasts: [],
    };

    components = {
        [EPage.Start]: Start,
        [EPage.Query]: Query,
        [EPage.Node]: Node,
        [EPage.Label]: Label,
        [EPage.Type]: Type,
        [EPage.Rel]: Relationship,
    };

    componentDidMount() {
        this.setState({
            activeTab: "Start",
            tabs: [{ title: "Start", icon: "fa-solid fa-play" }],
            contents: [{ title: "Start", page: EPage.Start, props: {} }],
        });
    }

    /**
     * Tab title has to be unique ..if already exists is switched on it
     */
    addTab = (title: string, icon: string, page: EPage, props: object = {}, active: boolean = true) => {
        if (this.state.tabs.filter(value => value.title === title).length) {
            this.setActiveTab(title);
            return;
        }

        //open new tab next to current active tab
        const i: number = this.state.tabs.findIndex(t => t.title === this.state.activeTab);
        let tabs = [...this.state.tabs];
        if (i !== -1) tabs.splice(i + 1, 0, { title: title, icon: icon });
        else tabs.push({ title: title, icon: icon });

        let data: object = {
            tabs: tabs,
            contents: this.state.contents.concat({ title: title, page: page, props: props }),
        };
        if (active) {
            data["activeTab"] = title;
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
        let data: object = {
            tabs: this.state.tabs.filter(tab => title !== tab.title),
            contents: this.state.contents.filter(content => title !== content.title),
        };

        if (this.state.activeTab === title) {
            let i: number = this.state.tabs.map(tab => tab.title).indexOf(title);
            data["activeTab"] = this.state.tabs[i - 1].title;
        }

        this.setState(data);
    };

    toast = (message: string, color = "is-success", delay = 3) => {
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
                <Navbar handleLogout={this.props.handleLogout} handleAddQueryTab={() => this.addTab(this.generateTabName("Query"), "fa-solid fa-terminal", EPage.Query)} />
                <section className="tabs is-boxed">
                    <ul>
                        {this.state.tabs.map(tab => (
                            <Tab key={"tab-" + tab.title} active={tab.title === this.state.activeTab} handleClick={this.setActiveTab} handleRemove={this.removeTab} {...tab} />
                        ))}
                    </ul>
                </section>
                <section className={"container " + (this.state.activeTab === "Start" ? "" : "is-fluid")}>
                    {this.state.contents.map(content => {
                        const MyComponent: typeof React.Component = this.components[content.page];
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
