import { EPage } from "./enums";
import * as React from "react";
import { t_StashValue, t_ToastFn } from "./types";

export interface ITabManager {
    add: (title: string | { prefix: string; i?: any }, icon: string, page: EPage, params?: object, id?: string, active?: boolean) => void;
    close: (id: string, e?: React.PointerEvent) => void;
    setActive: (id: string) => void;
    generateName: (prefix: string, i?: any) => string;
}

export interface ISettings {
    tableViewShowElementId: boolean;
    closeEditAfterExecuteSuccess: boolean;
    forceNamingRecommendations: boolean;
}

export interface IStashManager {
    add: (value: t_StashValue, database: string) => void;
    remove: (id: number) => void;
    indexOf: (value: t_StashValue) => number;
    empty: () => void;
    button: (value: t_StashValue, database: string, color?: string) => JSX.Element;
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
    settings: ISettings;
}
