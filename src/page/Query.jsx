import React, { Component } from "react";
import { neo4j, getDriver } from "../db";
import { Button } from "../form";

/**
 * Execute custom query
 * @todo
 * @todo use https://github.com/memgraph/orb to draw graph
 */
export default class Query extends Component {
    constructor(props) {
        super(props);
        this.state = {
            view: 1,
        };
    }

    render() {
        if (!this.props.active) return;
        return <>super duper pole pre CQL</>;
    }
}

// todo use to switch table <> graph
// <div className="level mb-3">
//     <div className="level-left">
//         <div className="level-item buttons">
//             <Button icon="fa-solid fa-plus" text="Create node" color="is-primary" />
//         </div>
//     </div>
//     <div className="level-right ">
//         <div className="level-item buttons has-addons">
//             <Button text="Table" color={this.state.view === 1 ? "is-info is-light is-active" : ""} icon="fa-solid fa-table" onClick={() => this.setState({ view: 1 })} />
//             <Button text="Graph" color={this.state.view === 2 ? "is-info is-light is-active" : ""} icon="fa-solid fa-circle-nodes" onClick={() => this.setState({ view: 2 })} />
//         </div>
//     </div>
// </div>
