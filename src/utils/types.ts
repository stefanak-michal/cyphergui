import { Node as Neo4jNode, Relationship as Neo4jRelationship } from "neo4j-driver";

export type t_StashValue = Neo4jNode | Neo4jRelationship;

export type t_ToastFn = (message: string, color?: string, delay?: number) => void;
