import * as React from "react";
import Tab from "./layout/Tab";
import Navbar from "./layout/Navbar";
import Start from "./page/Start";
import Query from "./page/Query";
import Node from "./page/Node";
import Label from "./page/Label";
import Type from "./page/Type";
import Relationship from "./page/Relationship";
import History from "./page/History";
import { EPage } from "./utils/enums";
import { Button } from "./components/form";
import { IStashEntry, IStashManager, ITabManager } from "./utils/interfaces";
import { t_StashValue, t_StorageStashEntry, t_ToastFn } from "./utils/types";
import db from "./db";
import Stash from "./layout/Stash";
import Settings from "./layout/Settings";
import { ClipboardContext, ToastContext } from "./utils/contexts";
import { Node as _Node, Relationship as _Relationship } from "neo4j-driver";

interface ILoggedState {
    activeTab: string | null;
    tabs: { id: string; title: string; icon: string }[];
    contents: { id: string; page: EPage; props: object }[];
    toasts: { key: number; message: string; color: string; delay: number; timeout: NodeJS.Timeout }[];
    settingsModal: boolean;
    stashed: IStashEntry[];
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
        stashed: [],
    };

    components = {
        [EPage.Start]: Start,
        [EPage.Query]: Query,
        [EPage.Node]: Node,
        [EPage.Label]: Label,
        [EPage.Type]: Type,
        [EPage.Rel]: Relationship,
        [EPage.History]: History,
    };

    constructor(props) {
        super(props);

        const tabs = localStorage.getItem("tabs");
        if (tabs) {
            const parsed = JSON.parse(tabs);
            this.state.tabs = parsed.tabs;
            this.state.contents = parsed.contents;
            this.state.activeTab = parsed.activeTab;
        }
    }

    componentDidMount() {
        this.tabManager.add("Start", "fa-solid fa-play", EPage.Start, {}, "Start", false);

        const stash = localStorage.getItem("stash");
        if (stash) {
            const parsed: t_StorageStashEntry[] = JSON.parse(stash);
            let i = 1;

            db.databases.forEach(database => {
                const dbName = database;
                const id_nodes = parsed.filter(p => p.database === dbName && p.type === "node").map(p => p.identity);
                if (id_nodes.length) {
                    db.driver
                        .session({ defaultAccessMode: db.neo4j.session.READ, database: dbName })
                        .run("MATCH (n) WHERE " + db.fnId("n") + " IN $id RETURN n", { id: id_nodes })
                        .then(response => {
                            if (response.records.length) {
                                response.records.forEach(rec => {
                                    this.stashManager.add(rec.get("n"), dbName, i++);
                                });
                            }
                        })
                        .catch(console.error);
                }

                const id_rels = parsed.filter(p => p.database === dbName && p.type === "rel").map(p => p.identity);
                if (id_rels.length) {
                    db.driver
                        .session({ defaultAccessMode: db.neo4j.session.READ, database: dbName })
                        .run("MATCH ()-[r]->() WHERE " + db.fnId("r") + " IN $id RETURN r", { id: id_rels })
                        .then(response => {
                            if (response.records.length) {
                                response.records.forEach(rec => {
                                    this.stashManager.add(rec.get("r"), dbName, i++);
                                });
                            }
                        })
                        .catch(console.error);
                }
            });
        }
    }

    tabManager: ITabManager = {
        /**
         * If already exists is switches on it
         */
        add: (title: string | { prefix: string; i?: any }, icon: string, page: EPage, props: object = {}, id: string = "", active: boolean = true): string => {
            if (typeof title === "object") {
                title = this.tabManager.generateName(title.prefix, title.i);
            }

            if (id.length === 0) {
                //auto generate id from props or title if not provided
                id = "id" in props && (typeof props.id === "number" || typeof props.id === "string") ? props.id.toString() : title;
                if ("database" in props) id += props.database;
            }

            this.setState(state => {
                if (!state.tabs.find(tab => tab.id === id)) {
                    //open new tab next to current active tab
                    const i: number = state.tabs.findIndex(t => t.id === state.activeTab);
                    if (i !== -1) state.tabs.splice(i + 1, 0, { id: id, title: title as string, icon: icon });
                    else state.tabs.push({ id: id, title: title as string, icon: icon });
                    state.contents.push({ id: id, page: page, props: props });
                } else {
                    //update props of existing tab
                    let content = state.contents.find(c => c.id === id);
                    content.props = { ...content.props, ...props };
                }

                const obj = {
                    tabs: state.tabs,
                    contents: state.contents,
                    activeTab: active || !state.activeTab ? id : state.activeTab,
                };
                localStorage.setItem("tabs", JSON.stringify(obj));
                return obj;
            });

            return id;
        },
        close: (id: string, e: React.PointerEvent = null) => {
            if (e !== null) e.stopPropagation();

            this.setState(state => {
                let active = state.activeTab;
                if (active === id) {
                    let i: number = state.tabs.findIndex(tab => tab.id === id);
                    if (i > 0) active = state.tabs[i - 1].id;
                }

                const obj = {
                    tabs: state.tabs.filter(tab => id !== tab.id),
                    contents: state.contents.filter(content => id !== content.id),
                    activeTab: active,
                };
                localStorage.setItem("tabs", JSON.stringify(obj));
                return obj;
            });
        },
        setActive: (id: string) => {
            this.setState(state => {
                localStorage.setItem("tabs", JSON.stringify({ tabs: state.tabs, contents: state.contents, activeTab: id }));
                return {
                    activeTab: id,
                };
            });
        },
        /**
         * Create tab name with requested prefix and index (it's calculated if omitted)
         */
        generateName: (prefix: string, i: any = null): string => {
            if (i === null) i = Math.max(0, ...this.state.tabs.filter(t => t.title.startsWith(prefix)).map(t => parseInt(t.title.split("#")[1]))) + 1;
            else i = db.strId(i);
            return prefix + "#" + i;
        },
    };

    saveStashToStorage = () => {
        localStorage.setItem(
            "stash",
            JSON.stringify(
                this.state.stashed.map<t_StorageStashEntry>(s => {
                    return {
                        database: s.database,
                        type: s.value instanceof _Node ? "node" : s.value instanceof _Relationship ? "rel" : "",
                        identity: db.getId(s.value),
                    };
                })
            )
        );
    };

    stashManager: IStashManager = {
        //maybe add queries?
        add: (value: t_StashValue, database: string, id: number = new Date().getTime()) => {
            this.setState(state => {
                return {
                    stashed: this.stashManager.indexOf(value, state.stashed) === -1 ? state.stashed.concat({ id: id, value: value, database: database }) : state.stashed,
                };
            }, this.saveStashToStorage);
        },
        remove: (id: number) => {
            this.setState(state => {
                return {
                    stashed: state.stashed.filter(s => s.id !== id),
                };
            }, this.saveStashToStorage);
        },
        indexOf: (value: t_StashValue, stashed: IStashEntry[] = null): number => {
            return (stashed || this.state.stashed).findIndex(s => {
                return db.getId(value) === db.getId(s.value);
            });
        },
        empty: () => {
            if (this.state.stashed.length > 0) this.setState({ stashed: [] });
            localStorage.removeItem("stash");
        },
        button: (value: t_StashValue, database: string, color: string = ""): JSX.Element => {
            const i = this.stashManager.indexOf(value);
            return (
                <Button
                    title={i === -1 ? "Add to stash" : "Remove from stash"}
                    onClick={() => (i === -1 ? this.stashManager.add(value, database) : this.stashManager.remove(this.state.stashed[i].id))}
                    color={color}
                    icon={i === -1 ? "fa-solid fa-folder-plus" : "fa-solid fa-folder-minus"}
                />
            );
        },
        get: (): IStashEntry[] => {
            return this.state.stashed;
        },
    };

    toast: t_ToastFn = (message: string, color = "is-success", delay = 3) => {
        const i: number = new Date().getTime();
        this.setState({
            toasts: [
                {
                    key: i,
                    message: message,
                    color: color,
                    delay: delay,
                    timeout: setTimeout(() => this.discardToast(i), delay * 1000),
                },
                ...this.state.toasts,
            ],
        });
    };

    discardToast = (i: number) => {
        this.setState(state => {
            return {
                toasts: state.toasts.filter(t => t.key !== i),
            };
        });
    };

    handleCopyToClipboard = (e: React.UIEvent) => {
        const target = e.currentTarget;
        let text = "";
        if (target.hasAttribute("data-copy")) {
            text = target.getAttribute("data-copy");
        } else if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLButtonElement) {
            if (target.value.length > 0) text = target.value;
        } else if (target instanceof HTMLElement) {
            if ((target.firstChild instanceof HTMLInputElement && target.firstChild.disabled) || (target.firstChild instanceof HTMLTextAreaElement && target.firstChild.disabled)) {
                if (target.firstChild.value.length > 0) text = target.firstChild.value;
            } else if (target.className.includes("icon") && target.className.includes("is-right")) {
                let element;
                for (let i = 0; i < target.parentElement.children.length; i++) {
                    element = target.parentElement.children[i];
                    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
                        if (element.value.length > 0) text = element.value;
                        break;
                    } else if (!element.className.includes("icon")) {
                        if (element.innerText.length > 0) text = element.innerText;
                        break;
                    }
                }
            } else if (target.innerText.length > 0) text = target.innerText;
        }

        if (text.length > 0) {
            navigator.clipboard.writeText(text);
            this.toast("Copied to clipboard", "is-success is-light");
        }
    };

    render() {
        if (this.state.tabs.length === 0 || this.state.activeTab === null) return;

        const activeContent = this.state.contents.find(c => c.id === this.state.activeTab);
        document.title =
            this.state.tabs.find(t => t.id === this.state.activeTab).title +
            (db.databases.length > 1 && "database" in activeContent.props ? " (db: " + activeContent.props.database + ")" : "") +
            " / cypherGUI";

        return (
            <>
                <Navbar handleLogout={this.props.handleLogout} handleOpenSettings={() => this.setState({ settingsModal: true })} tabManager={this.tabManager} />

                <section className="tabs is-boxed sticky has-background-white">
                    <ul>
                        {this.state.tabs.map(tab => (
                            <Tab key={"tab-" + tab.id} active={tab.id === this.state.activeTab} handleClick={this.tabManager.setActive} handleRemove={this.tabManager.close} {...tab} />
                        ))}
                    </ul>
                </section>

                <ClipboardContext.Provider value={this.handleCopyToClipboard}>
                    <ToastContext.Provider value={this.toast}>
                        <section className="container is-fluid">
                            {this.state.contents.map(content => {
                                const MyComponent: typeof React.Component = this.components[content.page];
                                return (
                                    <div key={"content-" + content.id} className={content.id === this.state.activeTab ? "" : "is-hidden"}>
                                        <MyComponent
                                            active={content.id === this.state.activeTab}
                                            tabName={this.state.tabs.filter(t => t.id === content.id)[0].title}
                                            tabId={content.id}
                                            tabManager={this.tabManager}
                                            toast={this.toast}
                                            stashManager={this.stashManager}
                                            {...content.props}
                                        />
                                    </div>
                                );
                            })}
                        </section>
                    </ToastContext.Provider>
                </ClipboardContext.Provider>

                <section className="notifications">
                    {this.state.toasts.map(toast => (
                        <div key={toast.key} className={"notification box fadeOut " + toast.color} style={{ animationDelay: toast.delay - 1 + "s" }}>
                            <button className="delete" onClick={() => this.discardToast(toast.key)} />
                            {toast.message}
                        </div>
                    ))}
                </section>

                {this.state.settingsModal && (
                    <Settings
                        handleClose={() => {
                            this.setState({ settingsModal: false });
                        }}
                    />
                )}

                <Stash stashed={this.state.stashed} tabManager={this.tabManager} stashManager={this.stashManager} />
            </>
        );
    }
}

export default Logged;
