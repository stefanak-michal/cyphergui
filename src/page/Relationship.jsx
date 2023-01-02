import { Component } from "react";
import { neo4j, getDriver } from "../db";

/**
 * Edit relationship by ID
 * @todo
 */
export default class Relationship extends Component {
    render() {
        if (!this.props.active) return;

        return <>Relationship edit</>;
    }
}
