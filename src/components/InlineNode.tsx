import { Button, LabelButton } from './form';
import db from '../db';
import { EPage } from '../utils/enums';
import { Node as _Node } from 'neo4j-driver-lite';
import { ITabManager } from '../utils/interfaces';
import { PropertiesModalContext } from '../utils/contexts';

const InlineNode: React.FC<{
    node: _Node;
    tabManager: ITabManager;
    database?: string;
    small?: boolean;
}> = ({ node, tabManager, database, small }) => {
    return (
        <div className='is-flex is-align-items-center'>
            {node.labels.map(label => (
                <LabelButton
                    key={label}
                    label={label}
                    database={database || db.database}
                    tabManager={tabManager}
                    size={'mr-1 ' + (small ? 'is-small' : 'is-medium')}
                />
            ))}
            <Button
                onClick={() =>
                    tabManager.add({ prefix: 'Node', i: node.identity }, 'fa-solid fa-pen-to-square', EPage.Node, {
                        id: db.getId(node),
                        database: database || db.database,
                    })
                }
                icon='fa-solid fa-pen-clip'
                color={small ? 'is-small' : ''}
                text={'#' + db.strInt(node.identity)}
            />
            <PropertiesModalContext.Consumer>
                {fn => (
                    <Button
                        icon='fa-solid fa-rectangle-list'
                        onClick={() => fn(node.properties)}
                        color={'ml-1 ' + (small ? 'is-small' : '')}
                        title='Properties'
                    />
                )}
            </PropertiesModalContext.Consumer>
        </div>
    );
};

export default InlineNode;
