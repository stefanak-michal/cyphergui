import { EPage } from "./enums";
import * as React from "react";

export interface ITabManager {
    add: (title: string, icon: string, page: EPage, params?: object, id?: string, active?: boolean) => void;
    close: (id: string, e?: React.PointerEvent) => void;
    setActive: (id: string) => void;
    generateName: (prefix: string, i?: any) => string;
}

export interface ISettings {
    showElementId: boolean;
}

export interface IPageProps {
    active: boolean;
    tabName: string;
    tabId: string;
    tabManager: ITabManager;
    toast: (message: string, color?: string, delay?: number) => void;
    settings: ISettings;
}
