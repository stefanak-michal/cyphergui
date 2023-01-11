import { Node as _Node, Relationship as _Relationship } from "neo4j-driver";

export type t_StashValue = _Node | _Relationship;

export type t_ToastFn = (message: string, color?: string, delay?: number) => void;
