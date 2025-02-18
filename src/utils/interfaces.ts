import { EPage } from './enums';
import { t_StashValue, t_ToastFn } from './types';
import { Integer } from 'neo4j-driver-lite';

export interface ITabManager {
    add: (
        title: string | { prefix: string; i?: any },
        icon: string,
        page: EPage,
        props?: object,
        id?: string,
        active?: boolean
    ) => string;
    close: (id: string, e?: React.PointerEvent) => void;
    closeAll: (e: React.PointerEvent) => void;
    setActive: (id: string) => void;
    generateName: (prefix: string, i?: Integer | string | number | null) => string;
    generateId: (props: { id?: number | string; database?: string }, title?: string) => string;
    setChanged: (id: string, changed: boolean, callback?: () => void) => void;
}

export interface ISettings {
    tableViewShowElementId: boolean;
    closeEditAfterExecuteSuccess: boolean;
    forceNamingRecommendations: boolean;
    temporalValueToStringFunction: string;
    darkMode: boolean;
    confirmCloseUnsavedChanges: boolean;
    rememberOpenTabs: boolean;
}

export interface IStashManager {
    add: (value: t_StashValue, database: string, id?: number) => void;
    remove: (id: number) => void;
    indexOf: (value: t_StashValue, stashed?: IStashEntry[]) => number;
    empty: () => void;
    button: (value: t_StashValue, database: string, color?: string) => React.ReactElement;
    get: () => IStashEntry[];
}

export interface IStashEntry {
    id: number;
    value: t_StashValue;
    database: string;
}

export interface IPageProps {
    active: boolean;
    tabName: string;
    tabId: string;
    tabManager: ITabManager;
    toast: t_ToastFn;
    stashManager: IStashManager;
}

export interface ITab {
    id: string;
    title: string;
    icon: string;
}

export interface ITabContent {
    id: string;
    page: EPage;
    props: object;
    changed?: boolean;
}
