import React, { Component } from "react";

export default class TableSortIcon extends Component {
    render() {
        return (
            <>
                {this.props.current.indexOf(this.props.sort) !== -1 && (
                    <span className="icon">
                        <i className="fa-solid fa-sort-down"></i>
                    </span>
                )}
                {this.props.current.indexOf(this.props.sort + " DESC") !== -1 && (
                    <span className="icon">
                        <i className="fa-solid fa-sort-up"></i>
                    </span>
                )}
            </>
        );
    }
}
