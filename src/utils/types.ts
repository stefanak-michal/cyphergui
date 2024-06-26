import { Node as _Node, Relationship as _Relationship } from 'neo4j-driver-lite';
import { EPropertyType } from './enums';

export class t_StashQuery {
    identity: string;
    query: string;
    constructor(identity: string, query: string) {
        this.identity = identity;
        this.query = query;
    }
}

export type t_StashValue = _Node | _Relationship | t_StashQuery;

export type t_ToastFn = (message: string, color?: string, delay?: number) => void;

export type t_StorageStashEntry = {
    database: string;
    type: string;
    identity: string | number | null;
};

export type t_FormValue = {
    key?: string;
    value: any;
    type: EPropertyType;
    temp?: any;
};
export type t_FormProperty = t_FormValue & {
    /* unique */ name: string;
    key: string;
};

export type t_ShowPropertiesModalFn = (properties: object) => void;

export type t_Log = {
    query: string;
    params: object;
    status: boolean;
    date: Date;
};
