import { Relationship as _Relationship } from 'neo4j-driver-lite';
import { ITabManager } from '../utils/interfaces';
import { Button, TypeButton } from './form';
import db from '../db';
import { EPage } from '../utils/enums';
import { PropertiesModalContext } from '../utils/contexts';
import { useContext } from 'react';

const InlineRelationship: React.FC<{
    rel: _Relationship;
    tabManager: ITabManager;
    database?: string;
    small?: boolean;
}> = ({ rel, tabManager, database, small }) => {
    const pmc = useContext(PropertiesModalContext);
    return (
        <div className='is-flex is-align-items-center'>
            <TypeButton
                type={rel.type}
                database={database || db.database}
                tabManager={tabManager}
                size={'mr-1 ' + (small ? 'is-small' : 'is-medium')}
            />
            <Button
                onClick={() =>
                    tabManager.add(
                        {
                            prefix: rel.type || 'Rel',
                            i: rel.identity,
                        },
                        'fa-regular fa-pen-to-square',
                        EPage.Rel,
                        {
                            id: db.getId(rel),
                            database: db.database,
                        }
                    )
                }
                icon='fa-solid fa-pen-clip'
                color={small ? 'is-small' : ''}
                text={'#' + db.strInt(rel.identity)}
            />
            {Object.keys(rel.properties).length > 0 && (
                <Button
                    icon='fa-solid fa-rectangle-list'
                    onClick={() => pmc(rel.properties)}
                    color={'ml-1 ' + (small ? 'is-small' : '')}
                    title='Properties'
                />
            )}
        </div>
    );
};

export default InlineRelationship;
