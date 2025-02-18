import { useState, useEffect, useCallback } from 'react';
import Tab from './layout/Tab';
import Navbar from './layout/Navbar';
import Start from './page/Start';
import Query from './page/Query';
import Node from './page/Node';
import Label from './page/Label';
import Type from './page/Type';
import Relationship from './page/Relationship';
import History from './page/History';
import { EPage } from './utils/enums';
import { Button } from './components/form';
import { IPageProps, IStashEntry, IStashManager, ITab, ITabContent, ITabManager } from './utils/interfaces';
import { t_ShowPropertiesModalFn, t_StashQuery, t_StashValue, t_StorageStashEntry, t_ToastFn } from './utils/types';
import db from './db';
import Stash from './layout/Stash';
import Settings, { settings } from './layout/Settings';
import { ClipboardContext, PropertiesModalContext, ToastContext } from './utils/contexts';
import { Node as _Node, Relationship as _Relationship } from 'neo4j-driver-lite';
import { CloseConfirmModal, PropertiesModal } from './components/Modal';

interface ILoggedProps {
    handleLogout: () => void;
    darkMode: boolean;
}

const Logged: React.FC<ILoggedProps> = ({ handleLogout, darkMode }) => {
    const [activeTab, setActiveTab] = useState<string | null>(null);
    const [tabs, setTabs] = useState<ITab[]>([]);
    const [contents, setContents] = useState<ITabContent[]>([]);
    const [toasts, setToasts] = useState<
        { key: number; message: string; color: string; delay: number; timeout: NodeJS.Timeout }[]
    >([]);
    const [settingsModal, setSettingsModal] = useState<boolean>(false);
    const [_stashed, setStashed] = useState<IStashEntry[]>([]);
    const [propertiesModal, setPropertiesModal] = useState<object | null>(null);
    const [confirmModal, setConfirmModal] = useState<string | null>(null);

    const components = {
        [EPage.Start]: Start,
        [EPage.Query]: Query,
        [EPage.Node]: Node,
        [EPage.Label]: Label,
        [EPage.Type]: Type,
        [EPage.Rel]: Relationship,
        [EPage.History]: History,
    };

    useEffect(() => {
        if (!settings().rememberOpenTabs) localStorage.removeItem('tabs');
        const _tabs = localStorage.getItem('tabs');
        if (_tabs) {
            const parsed = JSON.parse(_tabs);
            if (
                Array.isArray(parsed.tabs) &&
                (parsed.tabs as []).every(t => 'id' in t && 'title' in t && 'icon' in t) &&
                Array.isArray(parsed.contents) &&
                (parsed.contents as []).every(c => 'id' in c && 'page' in c && 'props' in c) &&
                parsed.tabs.length === parsed.contents.length
            ) {
                setTabs(parsed.tabs as ITab[]);
                setContents(parsed.contents as ITabContent[]);
                setActiveTab(parsed.activeTab);
            }
        } else {
            tabManager.add('Start', 'fa-solid fa-play', EPage.Start, {}, 'Start', false);
        }

        const stash = localStorage.getItem('stash');
        if (stash) {
            const parsed: t_StorageStashEntry[] = JSON.parse(stash);
            let i = 1;

            db.databases.forEach(database => {
                const dbName = database;
                const id_nodes = parsed.filter(p => p.database === dbName && p.type === 'node').map(p => p.identity);
                if (id_nodes.length) {
                    db.query('MATCH (n) WHERE ' + db.fnId('n') + ' IN $id RETURN n', { id: id_nodes }, dbName)
                        .then(response => {
                            if (response.records.length) {
                                response.records.forEach(rec => {
                                    stashManager.add(rec.get('n'), dbName, i++);
                                });
                            }
                        })
                        .catch(console.error);
                }

                const id_rels = parsed.filter(p => p.database === dbName && p.type === 'rel').map(p => p.identity);
                if (id_rels.length) {
                    db.query('MATCH ()-[r]->() WHERE ' + db.fnId('r') + ' IN $id RETURN r', { id: id_rels }, dbName)
                        .then(response => {
                            if (response.records.length) {
                                response.records.forEach(rec => {
                                    stashManager.add(rec.get('r'), dbName, i++);
                                });
                            }
                        })
                        .catch(console.error);
                }
            });

            // load queries into stash
            parsed
                .filter(p => p.type === 'query')
                .forEach(p => {
                    stashManager.add(new t_StashQuery(p.identity as string, p.database), '', i++);
                });
        }
    }, []);

    useEffect(() => {
        if (tabs.length && tabs.length === contents.length && activeTab !== null && settings().rememberOpenTabs) {
            localStorage.setItem(
                'tabs',
                JSON.stringify({
                    tabs: tabs,
                    contents: contents,
                    activeTab: activeTab,
                })
            );
        }
    }, [tabs, contents, activeTab]);

    useEffect(() => {
        if (_stashed.length) {
            localStorage.setItem(
                'stash',
                JSON.stringify(
                    _stashed.map<t_StorageStashEntry>(s => {
                        return {
                            database: s.value instanceof t_StashQuery ? s.value.query : s.database, //stash query uses database field for storing query
                            type:
                                s.value instanceof _Node
                                    ? 'node'
                                    : s.value instanceof _Relationship
                                      ? 'rel'
                                      : s.value instanceof t_StashQuery
                                        ? 'query'
                                        : '',
                            identity:
                                s.value instanceof _Node || s.value instanceof _Relationship
                                    ? db.getId(s.value)
                                    : s.value.identity,
                        };
                    })
                )
            );
        } else {
            localStorage.removeItem('stash');
        }
    }, [_stashed]);

    const tabManager: ITabManager = {
        /**
         * If already exists is switches on it
         */
        add: (
            title: string | { prefix: string; i?: any },
            icon: string,
            page: EPage,
            props: object = {},
            id: string = '',
            active: boolean = true
        ): string => {
            if (typeof title === 'object') {
                title = tabManager.generateName(title.prefix, title.i);
            }

            if (id.length === 0) id = tabManager.generateId(props, title);

            setTabs(state => {
                if (!state.find(tab => tab.id === id)) {
                    //open new tab next to current active tab
                    const i: number = state.findIndex(t => t.id === activeTab);
                    if (i !== -1)
                        state.splice(i + 1, 0, {
                            id: id,
                            title: title as string,
                            icon: icon,
                        });
                    else
                        state.push({
                            id: id,
                            title: title as string,
                            icon: icon,
                        } as ITab);
                    setContents(contents => [
                        ...contents,
                        {
                            id: id,
                            page: page,
                            props: props,
                        } as ITabContent,
                    ]);
                } else {
                    //update props of existing tab
                    setContents(contents =>
                        contents.map(content =>
                            content.id === id ? { ...content, props: { ...content.props, ...props } } : content
                        )
                    );
                }
                setActiveTab(active || !activeTab ? id : activeTab);
                return state;
            });

            return id;
        },
        close: (id: string, e: React.PointerEvent = null) => {
            if (e !== null) e.stopPropagation();

            if (settings().confirmCloseUnsavedChanges && !confirmModal && contents.find(c => c.id === id)?.changed) {
                setConfirmModal(id);
                return;
            }

            let active = activeTab;
            if (active === id) {
                const i: number = tabs.findIndex(tab => tab.id === id);
                if (i > 0) active = tabs[i - 1].id;
            }

            setActiveTab(active);
            setTabs(state => 
                 state.filter(tab => id !== tab.id)
            );
        },
        closeAll: (e: React.PointerEvent) => {
            e.stopPropagation();
            setActiveTab('Start');
            setTabs(state => state.filter(tab => tab.id === 'Start'));
        },
        setChanged: (id: string, changed: boolean, callback?) => {
            setContents(contents =>
                contents.map(content => (content.id === id ? { ...content, changed: changed } : content))
            );
            if (callback) callback();
        },
        setActive: (id: string) => {
            setActiveTab(id);
        },
        /**
         * Create tab name with requested prefix and index (it's calculated if omitted)
         */
        generateName: (prefix: string, i: any = null): string => {
            if (i === null)
                i =
                    Math.max(
                        0,
                        ...tabs.filter(t => t.title.startsWith(prefix)).map(t => parseInt(t.title.split('#')[1]))
                    ) + 1;
            else i = db.strInt(i);
            return prefix + '#' + i;
        },
        generateId: (props: { id?: number | string; database?: string }, title?: string): string => {
            let id: string =
                'id' in props && (typeof props.id === 'number' || typeof props.id === 'string')
                    ? props.id.toString()
                    : title;
            if ('database' in props) id += props.database;
            return id;
        },
    };

    const stashManager: IStashManager = {
        add: (value: t_StashValue, database: string, id: number = new Date().getTime()) => {
            setStashed(state => {
                return stashManager.indexOf(value, state) === -1
                    ? state.concat({
                          id: id,
                          value: value,
                          database: database,
                      })
                    : state;
            });
        },
        remove: (id: number) => {
            setStashed(state => state.filter(s => s.id !== id));
        },
        indexOf: (value: t_StashValue, stashed: IStashEntry[] = null): number => {
            return (stashed || _stashed).findIndex(s => {
                if (
                    (value instanceof _Node && s.value instanceof _Node) ||
                    (value instanceof _Relationship && s.value instanceof _Relationship)
                )
                    return db.getId(value) === db.getId(s.value);
                else if (value instanceof t_StashQuery && s.value instanceof t_StashQuery)
                    return value.identity === s.value.identity;
            });
        },
        empty: () => {
            if (_stashed.length > 0) setStashed([]);
        },
        button: (value: t_StashValue, database: string, color: string = ''): React.ReactElement => {
            const i = stashManager.indexOf(value);
            return (
                <Button
                    title={i === -1 ? 'Add to stash' : 'Remove from stash'}
                    onClick={() => (i === -1 ? stashManager.add(value, database) : stashManager.remove(_stashed[i].id))}
                    color={color}
                    icon={i === -1 ? 'fa-solid fa-folder-plus' : 'fa-solid fa-folder-minus'}
                />
            );
        },
        get: (): IStashEntry[] => {
            return _stashed;
        },
    };

    const toast: t_ToastFn = (message: string, color = 'is-success', delay = 3) => {
        const i: number = new Date().getTime();
        setToasts([
            {
                key: i,
                message: message,
                color: color,
                delay: delay,
                timeout: setTimeout(() => discardToast(i), delay * 1000),
            },
            ...toasts,
        ]);
    };

    const discardToast = (i: number) => {
        setToasts(state => state.filter(t => t.key !== i));
    };

    const handleCopyToClipboard = (e: React.UIEvent) => {
        const target = e.currentTarget;
        let text = '';
        if (target.hasAttribute('data-copy')) {
            text = target.getAttribute('data-copy');
        } else if (
            target instanceof HTMLInputElement ||
            target instanceof HTMLTextAreaElement ||
            target instanceof HTMLButtonElement
        ) {
            if (target.value.length > 0) text = target.value;
        } else if (target instanceof HTMLElement) {
            if (target.firstChild instanceof HTMLInputElement || target.firstChild instanceof HTMLTextAreaElement) {
                if (target.firstChild.value.length > 0) text = target.firstChild.value;
            } else if (target.className.includes('icon') && target.className.includes('is-right')) {
                let element;
                for (let i = 0; i < target.parentElement.children.length; i++) {
                    element = target.parentElement.children[i];
                    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
                        if (element.value.length > 0) text = element.value;
                        break;
                    } else if (!element.className.includes('icon')) {
                        if (element.innerText.length > 0) text = element.innerText;
                        break;
                    }
                }
            } else if (target.innerText.length > 0) text = target.innerText;
        }

        if (text.length > 0) {
            navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard', 'is-success is-light'));
        }
    };

    const handleShowPropertiesModal: t_ShowPropertiesModalFn = (properties: object) => {
        setPropertiesModal(properties);
    };

    if (tabs.length === 0 || activeTab === null) return null;

    const activeContent = contents.find(c => c.id === activeTab);
    document.title =
        tabs.find(t => t.id === activeTab)?.title +
        (db.databases.length > 1 && 'database' in activeContent.props
            ? ' (db: ' + activeContent.props.database + ')'
            : '') +
        ' / cypherGUI';

    return (
        <>
            <Navbar
                handleLogout={handleLogout}
                handleOpenSettings={() => setSettingsModal(true)}
                tabManager={tabManager}
                darkMode={darkMode}
            />

            <section className='tabs is-boxed sticky'>
                <ul>
                    {tabs.map(tab => (
                        <Tab key={'tab-' + tab.id} active={tab.id === activeTab} tabManager={tabManager} {...tab} />
                    ))}
                </ul>
            </section>

            <PropertiesModalContext.Provider value={handleShowPropertiesModal}>
                <ClipboardContext.Provider value={handleCopyToClipboard}>
                    <ToastContext.Provider value={toast}>
                        <section className='container is-fluid'>
                            {contents.map(content => {
                                const MyComponent: React.FC<IPageProps> = components[content.page];
                                return (
                                    <div
                                        key={'content-' + content.id}
                                        className={content.id === activeTab ? '' : 'is-hidden'}
                                    >
                                        <MyComponent
                                            active={content.id === activeTab}
                                            tabName={tabs.find(t => t.id === content.id)?.title}
                                            tabId={content.id}
                                            tabManager={tabManager}
                                            toast={toast}
                                            stashManager={stashManager}
                                            {...content.props}
                                        />
                                    </div>
                                );
                            })}
                        </section>
                    </ToastContext.Provider>
                </ClipboardContext.Provider>

                <Stash stashed={_stashed} tabManager={tabManager} stashManager={stashManager} />
            </PropertiesModalContext.Provider>

            <section className='notifications' aria-label='notifications'>
                {toasts.map(toast => (
                    <div
                        key={toast.key}
                        className={'notification fadeOut pr-6 ' + toast.color}
                        style={{ animationDelay: toast.delay - 1 + 's' }}
                    >
                        <button className='delete' onClick={() => discardToast(toast.key)} />
                        {toast.message}
                    </div>
                ))}
            </section>

            {settingsModal && (
                <Settings
                    handleClose={() => {
                        setSettingsModal(false);
                    }}
                />
            )}

            {propertiesModal && (
                <ClipboardContext.Provider value={handleCopyToClipboard}>
                    <PropertiesModal properties={propertiesModal} handleClose={() => setPropertiesModal(null)} />
                </ClipboardContext.Provider>
            )}

            {confirmModal && (
                <CloseConfirmModal
                    handleConfirm={() => {
                        tabManager.close(confirmModal as string);
                        setConfirmModal(null);
                    }}
                    handleClose={() => setConfirmModal(null)}
                />
            )}
        </>
    );
};

export default Logged;
