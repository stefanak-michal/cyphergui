import { toJSON } from '../../utils/fn';
import { ClipboardContext } from '../../utils/contexts';
import { Record } from 'neo4j-driver-lite';
import * as React from 'react';

interface IJsonProps {
    rows: Record[];
}

const Json: React.FC<IJsonProps> = ({ rows }) => {
    return (
        <div className='control has-icons-right'>
            <pre>{toJSON(rows)}</pre>
            <ClipboardContext.Consumer>
                {copy => (
                    <span className='icon is-right is-clickable' onClick={copy}>
                        <i className='fa-regular fa-copy' />
                    </span>
                )}
            </ClipboardContext.Consumer>
        </div>
    );
};

export default Json;
