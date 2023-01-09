import { EPage } from "./enums";
import * as React from "react";
import { Node as Neo4jNode, Relationship as Neo4jRelationship } from "neo4j-driver";

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

export type TStashValue = Neo4jNode | Neo4jRelationship;

export interface IStashManager {
    add: (value: TStashValue, database: string) => void;
    remove: (id: number) => void;
    indexOf: (value: TStashValue) => number;
    empty: () => void;
    button: (value: TStashValue, database: string, color?: string) => JSX.Element;
}

export interface IStashEntry {
    id: number;
    value: TStashValue;
    database: string;
}

export interface IPageProps {
    active: boolean;
    tabName: string;
    tabId: string;
    tabManager: ITabManager;
    toast: (message: string, color?: string, delay?: number) => void;
    stashManager: IStashManager;
    settings: ISettings;
}
