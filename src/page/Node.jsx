import { Component } from "react";
import { neo4j, getDriver } from "../db";

/**
 * Edit node by ID
 * @todo
 */
export default class Node extends Component {

    render() {
        if (!this.props.active) return

        return (
            <>
                Node edit
            </>
        )
    }
}
