import React, { Component } from "react";

export default class TableSortIcon extends Component {
    render() {
        return (
            <>
                {this.props.sort === this.props.current &&
                    <span className="icon">
                        <i className="fa-solid fa-sort-down"></i>
                    </span>
                }
                {this.props.sort + ' DESC' === this.props.current &&
                    <span className="icon">
                        <i className="fa-solid fa-sort-up"></i>
                    </span>
                }
            </>
        )
    }
}
