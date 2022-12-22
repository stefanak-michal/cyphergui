import React, { Component } from 'react'
import Pagination from "./block/Pagination";
import { neo4j, getDriver } from '../db'

/**
 * List all relationships with specific relationshipType
 * @todo
 */
export default class Type extends Component {
    render() {
        if (!this.props.active) return;

        return (
            <>
                relationship type
            </>
        )
    }
}
