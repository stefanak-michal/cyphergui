import * as React from 'react';
import { IPageProps } from '../utils/interfaces';
import db from '../db';
import { toJSON } from '../utils/fn';
import { EPage } from '../utils/enums';
import { Button } from '../components/form';
import { ClipboardContext } from '../utils/contexts';
import { t_Log } from '../utils/types';

interface IHistoryProps extends IPageProps {}
interface IHistoryState {
    logs: t_Log[];
}

class History extends React.Component<IHistoryProps, IHistoryState> {
    state: IHistoryState = {
        logs: db.logs,
    };

    componentDidUpdate(
        prevProps: Readonly<IHistoryProps>,
        prevState: Readonly<IHistoryState>
    ) {
        if (prevState.logs != db.logs) {
            this.setState({
                logs: db.logs,
            });
        }
    }

    printDate = (date: Date): string => {
        return (
            date.getFullYear() +
            '-' +
            (date.getMonth() + 1).toString().padStart(2, '0') +
            '-' +
            date.getDate().toString().padStart(2, '0') +
            ' ' +
            date.getHours().toString().padStart(2, '0') +
            ':' +
            date.getMinutes().toString().padStart(2, '0') +
            ':' +
            date.getSeconds().toString().padStart(2, '0') +
            '.' +
            date.getMilliseconds().toString().padStart(3, '0')
        );
    };

    render() {
        return (
            <div className='table-container'>
                <table className='table is-bordered is-striped is-narrow is-hoverable'>
                    <thead>
                        <tr>
                            <th>DateTime</th>
                            <th></th>
                            <th>Query</th>
                            <th>Parameters</th>
                            <th></th>
                        </tr>
                    </thead>
                    <ClipboardContext.Consumer>
                        {copy => (
                            <tbody>
                                {this.state.logs
                                    .slice()
                                    .reverse()
                                    .map(log => {
                                        return (
                                            <tr>
                                                <td>
                                                    {this.printDate(log.date)}
                                                </td>
                                                <td
                                                    className={
                                                        'has-text-weight-bold ' +
                                                        (log.status
                                                            ? 'has-text-success'
                                                            : 'has-text-danger')
                                                    }
                                                    title={
                                                        log.status
                                                            ? 'Success'
                                                            : 'Error'
                                                    }
                                                >
                                                    {log.status ? 'S' : 'E'}
                                                </td>
                                                <td>
                                                    <span
                                                        className='is-family-code is-pre-wrap is-copyable'
                                                        onClick={copy}
                                                    >
                                                        {log.query}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className='control has-icons-right'>
                                                        <pre>
                                                            {toJSON(log.params)}
                                                        </pre>
                                                        <span
                                                            className='icon is-right is-clickable'
                                                            onClick={copy}
                                                        >
                                                            <i className='fa-regular fa-copy' />
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <Button
                                                        icon='fa-solid fa-terminal'
                                                        onClick={() =>
                                                            this.props.tabManager.add(
                                                                {
                                                                    prefix: 'Query',
                                                                    i: log.date.toISOString(),
                                                                },
                                                                'fa-solid fa-terminal',
                                                                EPage.Query,
                                                                {
                                                                    query: log.query,
                                                                }
                                                            )
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        )}
                    </ClipboardContext.Consumer>
                </table>
            </div>
        );
    }
}

export default History;
