import { useState, useEffect } from 'react';
import db from '../db';
import { Button } from '../components/form';
import { ITabManager } from '../utils/interfaces';
import { EPage } from '../utils/enums';
import logo from '../assets/logo_small.png';
import logo_dark from '../assets/logo_small_dark.png';

interface INavbarProps {
    handleLogout: () => void;
    handleOpenSettings: () => void;
    tabManager: ITabManager;
    darkMode: boolean;
}

const Navbar: React.FC<INavbarProps> = ({ handleLogout, handleOpenSettings, tabManager, darkMode }) => {
    const [open, setOpen] = useState(false);
    const [databases, setDatabases] = useState<string[]>([]);
    const [activeDb, setActiveDb] = useState('');

    useEffect(() => {
        setDatabases(db.databases);
        setActiveDb(db.database);

        db.registerChangeDatabasesCallback((databases: string[]) => {
            setDatabases(databases);
        });
    }, []);

    const handleOpen = () => {
        setOpen(!open);
    };

    return (
        <nav className='navbar' role='navigation' aria-label='main navigation'>
            <div className='navbar-brand'>
                <span className='navbar-item'>
                    <img src={darkMode ? logo_dark : logo} alt='cypherGUI' />
                </span>

                <a
                    href='#'
                    role='button'
                    className={'navbar-burger ' + (open ? 'is-active' : '')}
                    aria-label='menu'
                    aria-expanded='false'
                    data-target='basicNavbar'
                    onClick={handleOpen}
                >
                    <span aria-hidden='true'></span>
                    <span aria-hidden='true'></span>
                    <span aria-hidden='true'></span>
                </a>
            </div>

            <div id='basicNavbar' className={'navbar-menu ' + (open ? 'is-active' : '')}>
                <div className='navbar-start'>
                    {databases.length > 1 && (
                        <div className='navbar-item has-dropdown is-hoverable'>
                            <a className='navbar-link'>{activeDb}</a>
                            <div className='navbar-dropdown'>
                                {databases.map(name => (
                                    <a
                                        key={'navbar-item-' + name}
                                        className={(activeDb === name ? 'is-active' : '') + ' navbar-item'}
                                        onClick={() => {
                                            db.database = name;
                                            setActiveDb(name);
                                        }}
                                    >
                                        {name}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className='navbar-end'>
                    <div className='navbar-item'>
                        <div className='buttons'>
                            <Button
                                icon='fa-regular fa-plus'
                                text='Query'
                                onClick={() => tabManager.add({ prefix: 'Query' }, 'fa-solid fa-terminal', EPage.Query)}
                                color='is-link'
                            />
                            <Button
                                icon='fa-solid fa-clock-rotate-left'
                                title='Open history'
                                onClick={() =>
                                    tabManager.add('History', 'fa-solid fa-clock-rotate-left', EPage.History)
                                }
                            />
                            <Button icon='fa-solid fa-gears' onClick={handleOpenSettings} title='Open settings' />
                            <Button onClick={handleLogout} text='Log out' />
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
