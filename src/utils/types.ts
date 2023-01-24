import { Node as _Node, Relationship as _Relationship } from "neo4j-driver";
import { EPropertyType } from "./enums";

export type t_StashValue = _Node | _Relationship;

export type t_ToastFn = (message: string, color?: string, delay?: number) => void;

export type t_StorageStashEntry = { database: string; type: string; identity: string | number | null };

export type t_FormProperty = { /* unique */ name: string; key: string; value: any; type: EPropertyType; subtype: EPropertyType | null; temp: any };

export type t_ShowPropertiesModalFn = (properties: object) => void;
