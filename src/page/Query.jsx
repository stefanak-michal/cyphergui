import React, { Component } from "react";
import { neo4j, getDriver } from "../db";

/**
 * Execute custom query
 * @todo
 */
export default class Query extends Component {
    render() {
        if (!this.props.active) return;
        return <>super duper pole pre CQL</>;
    }
}
