const Pagination: React.FC<{
    pages: number;
    page: number;
    action: (i: number) => void;
}> = ({ pages, page, action }) => {
    if (pages <= 1) return null;

    const links = [];
    if (page >= 4) {
        links.push(1, 'e', page - 1);
    } else {
        for (let i = 1; i < page; i++) links.push(i);
    }

    links.push(page);

    if (page <= pages - 3) {
        links.push(page + 1, 'e', pages);
    } else {
        for (let i = page + 1; i <= pages; i++) links.push(i);
    }

    return (
        <nav className='pagination is-centered' role='navigation' aria-label='pagination'>
            <button
                className='pagination-previous button'
                disabled={page === 1}
                onClick={() => action(page - 1)}
                aria-label='Goto previous page'
            >
                <span className='icon'>
                    <i className='fa-solid fa-chevron-left' />
                </span>
            </button>
            <button
                className='pagination-next button'
                disabled={page === pages}
                onClick={() => action(page + 1)}
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
                                className={'button pagination-link ' + (page === value ? 'is-current' : '')}
                                onClick={() => action(value)}
                                aria-label={'Goto page ' + value}
                                aria-current={page === value ? 'page' : false}
                            >
                                {value}
                            </button>
                        )}
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default Pagination;
