import * as React from "react";

export default class TableSortIcon extends React.Component<{ current: string[]; sort: string }> {
    render() {
        return (
            <>
                {this.props.current.indexOf(this.props.sort) !== -1 && (
                    <span className="icon">
                        <i className="fa-solid fa-sort-down" />
                    </span>
                )}
                {this.props.current.indexOf(this.props.sort + " DESC") !== -1 && (
                    <span className="icon">
                        <i className="fa-solid fa-sort-up" />
                    </span>
                )}
            </>
        );
    }
}
