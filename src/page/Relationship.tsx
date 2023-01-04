import * as React from "react";
import { neo4j, getDriver } from "../db";
import IPageProps from "./IPageProps";

interface IRelationshipProps extends IPageProps {}

/**
 * Edit relationship by ID
 * @todo
 */
class Relationship extends React.Component<IRelationshipProps> {
    render() {
        if (!this.props.active) return;

        return <>Relationship edit</>;
    }
}

export default Relationship;
