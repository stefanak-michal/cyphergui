import { toJSON } from '../../utils/fn';
import { ClipboardContext } from '../../utils/contexts';
import * as React from 'react';
import { ResultSummary } from 'neo4j-driver-lite';

interface ISummaryProps {
    summary: ResultSummary;
}

const Summary: React.FC<ISummaryProps> = ({ summary }) => {
    return (
        <div className='control has-icons-right'>
            <pre>{toJSON(summary)}</pre>
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

export default Summary;
