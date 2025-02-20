import { toJSON } from '../../utils/fn';
import { ClipboardContext } from '../../utils/contexts';
import { Record } from 'neo4j-driver-lite';
import { useContext } from 'react';

interface IJsonProps {
    rows: Record[];
}

const Json: React.FC<IJsonProps> = ({ rows }) => {
    const copy = useContext(ClipboardContext);
    return (
        <div className='control has-icons-right'>
            <pre>{toJSON(rows)}</pre>
            <span className='icon is-right is-clickable' onClick={copy}>
                <i className='fa-regular fa-copy' />
            </span>
        </div>
    );
};

export default Json;
