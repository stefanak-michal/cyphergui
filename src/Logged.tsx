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
import Modal from "./page/block/Modal";
import { Button, Checkbox } from "./form";
import { ISettings, ITabManager } from "./interfaces";
import db from "./db";
import { Integer } from "neo4j-driver";

interface ILoggedState {
    activeTab: string | null;
    tabs: { id: string; title: string; icon: string }[];
    contents: { id: string; page: EPage; props: object }[];
    toasts: { key: number; message: string; color: string; delay: number; timeout: NodeJS.Timeout }[];
    settingsModal: boolean;
    settings: ISettings;
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
        settingsModal: false,
        settings: {
            showElementId: true,
        },
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
            tabs: [{ id: "Start", title: "Start", icon: "fa-solid fa-play" }],
            contents: [{ id: "Start", page: EPage.Start, props: {} }],
        });
    }

    tabManager: ITabManager = {
        /**
         * If already exists is switches on it
         */
        add: (title: string, icon: string, page: EPage, props: object = {}, id?: string, active: boolean = true) => {
            if (!id) {
                //auto generate id from props or title if not provided
                id = "id" in props && (props.id instanceof Integer || typeof props.id === "string") ? db.strId(props.id) : title;
                if ("database" in props) id += props.database;
            }

            if (this.state.tabs.find(value => value.id === id)) {
                this.tabManager.setActive(id);
                return;
            }

            //open new tab next to current active tab
            const i: number = this.state.tabs.findIndex(t => t.id === this.state.activeTab);
            let tabs = [...this.state.tabs];
            const newTab = { id: id, title: title, icon: icon };
            if (i !== -1) tabs.splice(i + 1, 0, newTab);
            else tabs.push(newTab);

            let data: object = {
                tabs: tabs,
                contents: this.state.contents.concat({ id: id, page: page, props: props }),
            };
            if (active) {
                data["activeTab"] = id;
            }
            this.setState(data);
        },
        close: (id: string, e?: React.PointerEvent) => {
            !!e && e.stopPropagation();
            let data: object = {
                tabs: this.state.tabs.filter(tab => id !== tab.id),
                contents: this.state.contents.filter(content => id !== content.id),
            };

            if (this.state.activeTab === id) {
                let i: number = this.state.tabs.map(tab => tab.id).indexOf(id);
                data["activeTab"] = this.state.tabs[i - 1].id;
            }

            this.setState(data);
        },
        setActive: (id: string) => {
            this.setState({
                activeTab: id,
            });
        },
        /**
         * Create tab name with requested prefix and index (it's calculated if omitted)
         */
        generateName: (prefix: string, i?: any): string => {
            if (i === undefined) i = Math.max(0, ...this.state.tabs.filter(t => t.title.indexOf(prefix) === 0).map(t => parseInt(t.title.split("#")[1]))) + 1;
            else if (db.isInteger(i)) i = db.neo4j.integer.toString(i);
            return prefix + "#" + i;
        },
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
                <Navbar
                    handleLogout={this.props.handleLogout}
                    handleAddQueryTab={() => this.tabManager.add(this.tabManager.generateName("Query"), "fa-solid fa-terminal", EPage.Query)}
                    handleOpenSettings={() => this.setState({ settingsModal: true })}
                />
                <section className="tabs is-boxed">
                    <ul>
                        {this.state.tabs.map(tab => (
                            <Tab key={"tab-" + tab.id} active={tab.id === this.state.activeTab} handleClick={this.tabManager.setActive} handleRemove={this.tabManager.close} {...tab} />
                        ))}
                    </ul>
                </section>
                <section className={"container " + (this.state.activeTab === "Start" ? "" : "is-fluid")}>
                    {this.state.contents.map(content => {
                        const MyComponent: typeof React.Component = this.components[content.page];
                        return (
                            <MyComponent
                                key={"content-" + content.id}
                                active={content.id === this.state.activeTab}
                                tabName={this.state.tabs.filter(t => t.id === content.id)[0].title}
                                tabId={content.id}
                                tabManager={this.tabManager}
                                toast={this.toast}
                                settings={this.state.settings}
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

                {this.state.settingsModal && (
                    <Modal title="Settings" handleClose={() => this.setState({ settingsModal: false })}>
                        <div className="mb-3">
                            <Checkbox
                                name="showElementId"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => this.setState({ settings: { ...this.state.settings, showElementId: e.currentTarget.checked } })}
                                label="Show elementId"
                                checked={this.state.settings.showElementId}
                                color="is-dark"
                            />
                        </div>
                        <div className="buttons is-justify-content-flex-end">
                            <Button text="Close" icon="fa-solid fa-xmark" onClick={() => this.setState({ settingsModal: false })} color="is-secondary" />
                        </div>
                    </Modal>
                )}
            </>
        );
    }
}

export default Logged;
