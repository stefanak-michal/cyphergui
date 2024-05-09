import * as React from 'react';

export default class Pagination extends React.Component<{
    pages: number;
    page: number;
    action: (i: number) => void;
}> {
    render() {
        if (this.props.pages <= 1) return undefined;

        const links = [];
        if (this.props.page >= 4) {
            links.push(1, 'e', this.props.page - 1);
        } else {
            for (let i = 1; i < this.props.page; i++) links.push(i);
        }

        links.push(this.props.page);

        if (this.props.page <= this.props.pages - 3) {
            links.push(this.props.page + 1, 'e', this.props.pages);
        } else {
            for (let i = this.props.page + 1; i <= this.props.pages; i++) links.push(i);
        }

        return (
            <nav className='pagination is-centered' role='navigation' aria-label='pagination'>
                <button
                    className='pagination-previous button'
                    disabled={this.props.page === 1}
                    onClick={() => this.props.action(this.props.page - 1)}
                    aria-label='Goto previous page'
                >
                    <span className='icon'>
                        <i className='fa-solid fa-chevron-left' />
                    </span>
                </button>
                <button
                    className='pagination-next button'
                    disabled={this.props.page === this.props.pages}
                    onClick={() => this.props.action(this.props.page + 1)}
                    aria-label='Goto next page'
                >
                    <span className='icon'>
                        <i className='fa-solid fa-chevron-right' />
                    </span>
                </button>
                <ul className='pagination-list'>
                    {links.map((value, i) => (
                        <li key={'li' + i}>
                            {value === 'e' && <span className='pagination-ellipsis'>&hellip;</span>}
                            {typeof value === 'number' && (
                                <button
                                    className={
                                        'button pagination-link ' + (this.props.page === value ? 'is-current' : '')
                                    }
                                    onClick={() => this.props.action(value)}
                                    aria-label={'Goto page ' + value}
                                    aria-current={this.props.page === value ? 'page' : false}
                                >
                                    {value}
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            </nav>
        );
    }
}
