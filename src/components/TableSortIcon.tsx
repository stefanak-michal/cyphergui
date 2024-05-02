import * as React from 'react';

export default class TableSortIcon extends React.Component<{
    current: string[];
    sort: string;
}> {
    render() {
        return (
            <>
                {this.props.current.includes(this.props.sort) && (
                    <span className='icon'>
                        <i className='fa-solid fa-sort-down' />
                    </span>
                )}
                {this.props.current.includes(this.props.sort + ' DESC') && (
                    <span className='icon'>
                        <i className='fa-solid fa-sort-up' />
                    </span>
                )}
            </>
        );
    }
}
