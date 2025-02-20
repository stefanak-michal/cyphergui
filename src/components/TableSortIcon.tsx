const TableSortIcon: React.FC<{ current: string[]; sort: string }> = ({ current, sort }) => {
    return (
        <>
            {current.includes(sort) && (
                <span className='icon'>
                    <i className='fa-solid fa-sort-down' />
                </span>
            )}
            {current.includes(sort + ' DESC') && (
                <span className='icon'>
                    <i className='fa-solid fa-sort-up' />
                </span>
            )}
        </>
    );
};

export default TableSortIcon;
