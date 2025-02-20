import { toJSON } from '../../utils/fn';
import { ClipboardContext } from '../../utils/contexts';
import { ResultSummary } from 'neo4j-driver-lite';
import { useContext } from 'react';

interface ISummaryProps {
    summary: ResultSummary;
}

const Summary: React.FC<ISummaryProps> = ({ summary }) => {
    const copy = useContext(ClipboardContext);
    return (
        <div className='control has-icons-right'>
            <pre>{toJSON(summary)}</pre>
            <span className='icon is-right is-clickable' onClick={copy}>
                <i className='fa-regular fa-copy' />
            </span>
        </div>
    );
};

export default Summary;
