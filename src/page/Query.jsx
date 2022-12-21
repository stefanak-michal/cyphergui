import React, { Component } from 'react'
import { DbContext } from "../db-context"

class Query extends Component {
    render() {
        if (!this.props.active) return;
        return (
            <>
                super duper pole pre CQL
            </>
        )
    }
}

Query.contextType = DbContext

export default Query
