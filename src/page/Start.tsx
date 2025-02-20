import { useState, useEffect, useRef } from 'react';
import { Button, LabelButton, TypeButton } from '../components/form';
import { EPage } from '../utils/enums';
import { IPageProps } from '../utils/interfaces';
import db from '../db';

const Start: React.FC<IPageProps> = props => {
    const [labels, setLabels] = useState<string[]>([]);
    const [types, setTypes] = useState<string[]>([]);
    const [serverInfo, setServerInfo] = useState<object>({});
    const [error, setError] = useState<string | null>(null);
    const latestRequest = useRef<AbortController>(null);

    const requestData = () => {
        latestRequest.current?.abort();
        const ac: AbortController = new AbortController();
        latestRequest.current = ac;

        Promise.all([
            db.query(
                'MATCH (n) WITH DISTINCT labels(n) AS ll UNWIND ll AS l RETURN collect(DISTINCT l) AS c',
                {},
                db.database
            ),
            db.query('MATCH ()-[n]-() RETURN collect(DISTINCT type(n)) AS c', {}, db.database),
            db.driver.getServerInfo(),
        ])
            .then(responses => {
                if (ac.signal.aborted) return;
                setLabels(responses[0].records[0].get('c'));
                setTypes(responses[1].records[0].get('c'));
                setServerInfo(responses[2]);
            })
            .catch(err => setError('[' + err.name + '] ' + err.message));
    };

    useEffect(() => {
        db.registerChangeActiveDatabaseCallback(requestData);
        requestData();
    }, []);

    useEffect(() => {
        if (props.active) requestData();
    }, [props.active]);

    return (
        <div className='columns'>
            <div className='column is-three-fifths-desktop is-offset-one-fifth-desktop'>
                {error && (
                    <div className='message is-danger'>
                        <div className='message-header'>
                            <p>Error</p>
                            <button className='delete' aria-label='delete' onClick={() => setError(null)} />
                        </div>
                        <div className='message-body'>{error}</div>
                    </div>
                )}

                <div className='subtitle mb-2'>Server</div>
                {Object.keys(serverInfo).length ? (
                    <div>
                        Connected to <b>{serverInfo['address'] || ''}</b> with protocol version{' '}
                        <b>{serverInfo['protocolVersion'] || ''}</b>.
                    </div>
                ) : (
                    <div>Loading ...</div>
                )}
                <br />
                <div className='subtitle mb-2'>Node labels</div>
                <div className='buttons'>
                    {labels.length > 0 ? (
                        <>
                            <LabelButton
                                key='all-labels'
                                label='* '
                                database={db.database}
                                tabManager={props.tabManager}
                                size='is-medium'
                            />{' '}
                            {/* space after space is required */}
                            {labels.map(label => (
                                <LabelButton
                                    key={label}
                                    label={label}
                                    database={db.database}
                                    tabManager={props.tabManager}
                                    size='is-medium'
                                />
                            ))}
                        </>
                    ) : (
                        <span className='has-text-grey-light'>none</span>
                    )}
                </div>
                <div className='buttons'>
                    <Button
                        icon='fa-solid fa-plus'
                        text='Create node'
                        color='is-primary'
                        onClick={() =>
                            props.tabManager.add(
                                { prefix: 'New node' },
                                'fa-solid fa-square-plus',
                                EPage.Node,
                                { id: null, database: db.database },
                                new Date().getTime().toString()
                            )
                        }
                    />
                </div>
                <br />
                <div className='subtitle mb-2'>Relationship types</div>
                <div className='buttons'>
                    {types.length > 0 ? (
                        <>
                            <TypeButton
                                key='all-types'
                                type='*'
                                database={db.database}
                                tabManager={props.tabManager}
                                size='is-medium'
                            />
                            {types.map(type => (
                                <TypeButton
                                    key={type}
                                    type={type}
                                    database={db.database}
                                    tabManager={props.tabManager}
                                    size='is-medium'
                                />
                            ))}
                        </>
                    ) : (
                        <span className='has-text-grey-light'>none</span>
                    )}
                </div>
                <div className='buttons'>
                    <Button
                        icon='fa-solid fa-plus'
                        text='Create relationship'
                        color='is-primary'
                        onClick={() =>
                            props.tabManager.add(
                                { prefix: 'New relationship' },
                                'fa-regular fa-square-plus',
                                EPage.Rel,
                                { id: null, database: db.database },
                                new Date().getTime().toString()
                            )
                        }
                    />
                </div>
                <br />
                <br />
            </div>
        </div>
    );
};

export default Start;
