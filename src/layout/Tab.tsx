import { useState } from 'react';
import { ITabManager } from '../utils/interfaces';

interface ITabProps {
    id: string;
    active: boolean;
    icon?: string;
    title: string;
    tabManager: ITabManager;
}

/**
 * Tab header
 */
const Tab: React.FC<ITabProps> = ({ id, active, icon, title, tabManager }) => {
    const [showDelete, setShowDelete] = useState(false);

    const handleMouseEnter = () => setShowDelete(true);
    const handleMouseLeave = () => setShowDelete(false);

    const handleClick = (e: React.MouseEvent) => {
        if (id === 'Start') {
            tabManager.setActive(id);
            return;
        }
        if (e.ctrlKey) {
            tabManager.close(id, e as any);
            return;
        }
        if (e.shiftKey) {
            tabManager.closeAll(e as any);
            return;
        }
        tabManager.setActive(id);
    };

    return (
        <li
            className={active ? 'is-active' : ''}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            title={id !== 'Start' ? 'Ctrl+click close tab\nShift+click close all tabs (ignores unsaved changes)' : ''}
        >
            <a>
                {icon && (
                    <span className='icon'>
                        <i className={icon} aria-hidden='true' />
                    </span>
                )}
                <span>{title}</span>
                {title !== 'Start' && showDelete && (
                    <button className='delete is-small ml-3' onClick={(e: any) => tabManager.close(id, e)} />
                )}
            </a>
        </li>
    );
};

export default Tab;
