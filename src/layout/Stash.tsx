import { useState, useEffect } from 'react';
import { Node as _Node, Relationship as _Relationship } from 'neo4j-driver-lite';
import db from '../db';
import { IStashEntry, IStashManager, ITabManager } from '../utils/interfaces';
import { Button } from '../components/form';
import InlineNode from '../components/InlineNode';
import InlineRelationship from '../components/InlineRelationship';
import { EPage } from '../utils/enums';
import { t_StashQuery } from '../utils/types';

interface IStashProps {
    stashed: IStashEntry[];
    tabManager: ITabManager;
    stashManager: IStashManager;
}

const Stash: React.FC<IStashProps> = ({ stashed, tabManager, stashManager }) => {
    const [active, setActive] = useState(false);
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState('All');
    const [pulse, setPulse] = useState(false);

    useEffect(() => {
        if (stashed.length !== stashed.length && !pulse) setPulse(true);
    }, [stashed]);

    const filter = (entry: IStashEntry): boolean => {
        if (tab === 'Nodes' && !(entry.value instanceof _Node)) return false;
        if (tab === 'Relationships' && !(entry.value instanceof _Relationship)) return false;
        if (tab === 'Queries' && !(entry.value instanceof t_StashQuery)) return false;
        if (search.length === 0) return true;
        if (db.strInt(entry.value.identity) === search) return true;
        if ('elementId' in entry.value && db.hasElementId && entry.value.elementId.includes(search)) return true;
        if (entry.value instanceof _Node && entry.value.labels.filter(x => x.indexOf(search) >= 0).length > 0)
            return true;
        if (entry.value instanceof _Relationship && entry.value.type.indexOf(search) >= 0) return true;
        if (entry.value instanceof t_StashQuery && entry.value.query.indexOf(search) >= 0) return true;
        return false;
    };

    return (
        <section className={'stash panel is-link ' + (active ? 'is-active' : '')}>
            <div className='panel-heading is-clickable wspace-nowrap' onClick={() => setActive(!active)}>
                <span
                    className={'icon mr-2 animate__animated ' + (pulse ? 'animate__swing' : '')}
                    onAnimationEnd={() => setPulse(false)}
                >
                    <i className={'fa-regular fa-folder' + (active ? '-open' : '')} />
                </span>
                Stash
            </div>
            <div className='panel-body'>
                <div className='panel-block'>
                    <p className='control has-icons-left has-icons-right'>
                        <input
                            className='input'
                            type='text'
                            placeholder='Search'
                            value={search}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.currentTarget.value)}
                        />
                        <span className='icon is-left'>
                            <i className='fas fa-search' aria-hidden='true' />
                        </span>
                        <span className='icon is-right is-clickable' onClick={() => setSearch('')}>
                            <i className='fa-solid fa-xmark' />
                        </span>
                    </p>
                </div>
                <p className='panel-tabs'>
                    {['All', 'Nodes', 'Relationships', 'Queries'].map(t => (
                        <a key={t} className={tab === t ? 'is-active' : ''} onClick={() => setTab(t)}>
                            {t}
                        </a>
                    ))}
                </p>
                {stashed.filter(filter).map(entry => (
                    <div className='panel-block is-hoverable' key={entry.id}>
                        {entry.value instanceof _Node && (
                            <InlineNode
                                node={entry.value}
                                tabManager={tabManager}
                                database={entry.database}
                                small={true}
                            />
                        )}
                        {entry.value instanceof _Relationship && (
                            <InlineRelationship
                                rel={entry.value}
                                tabManager={tabManager}
                                database={entry.database}
                                small={true}
                            />
                        )}
                        {entry.value instanceof t_StashQuery && (
                            <a
                                className='is-align-items-center'
                                title={entry.value.query.length > 25 ? entry.value.query : ''}
                                onClick={() =>
                                    tabManager.add(
                                        entry.value.identity as string,
                                        'fa-solid fa-terminal',
                                        EPage.Query,
                                        {
                                            query: entry.value['query'],
                                        }
                                    )
                                }
                            >
                                {entry.value.query.substring(0, 25)} {entry.value.query.length > 25 ? '...' : ''}
                            </a>
                        )}
                        {(entry.value instanceof _Node || entry.value instanceof _Relationship) &&
                            db.databases.length > 1 && <span className='ml-1'>(db: {entry.database})</span>}
                        <button className='delete ml-auto' onClick={() => stashManager.remove(entry.id)} />
                    </div>
                ))}
                {stashed.filter(filter).length === 0 && <span className='panel-block has-text-grey-light'>empty</span>}
                <div className='panel-block'>
                    <Button
                        text='Clear stash'
                        color='is-link is-outlined is-fullwidth'
                        onClick={() => stashManager.empty()}
                    />
                </div>
            </div>
        </section>
    );
};

export default Stash;
