import { Component } from "react";
import { neo4j, getDriver } from "../db";

/**
 * Edit node by ID
 * @todo
 */
class Node extends Component {

    render() {
        if (!this.props.active) return
        document.title = 'Node #' + this.props.id;

        return (
            <>
                Node edit
            </>
        )
    }
}

export default Node
