import { toJSON } from '../../utils/fn';
import { ClipboardContext } from '../../utils/contexts';
import { Record } from 'neo4j-driver-lite';
import * as React from 'react';

interface IJsonProps {
    rows: Record[];
}

class Json extends React.Component<IJsonProps> {
    render() {
        return (
            <div className='control has-icons-right'>
                <pre>{toJSON(this.props.rows)}</pre>
                <ClipboardContext.Consumer>
                    {copy => (
                        <span className='icon is-right is-clickable' onClick={copy}>
                            <i className='fa-regular fa-copy' />
                        </span>
                    )}
                </ClipboardContext.Consumer>
            </div>
        );
    }
}

export default Json;
