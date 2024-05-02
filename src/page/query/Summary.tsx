import { toJSON } from '../../utils/fn';
import { ClipboardContext } from '../../utils/contexts';
import * as React from 'react';
import { ResultSummary } from 'neo4j-driver-lite';

interface ISummaryProps {
    summary: ResultSummary;
}

class Summary extends React.Component<ISummaryProps, null> {
    render() {
        return (
            <div className='control has-icons-right'>
                <pre>{toJSON(this.props.summary)}</pre>
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

export default Summary;
