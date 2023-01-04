import * as React from "react";
import Pagination from "./block/Pagination";
import { neo4j, getDriver } from "../db";
import IPageProps from "./IPageProps";

interface ITypeProps extends IPageProps {}

/**
 * List all relationships with specific relationshipType
 * @todo
 */
class Type extends React.Component<ITypeProps> {
    render() {
        if (!this.props.active) return;

        return <>relationship type</>;
    }
}

export default Type;
