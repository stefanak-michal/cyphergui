import { useState, useEffect, useCallback } from 'react';
import './main.sass';
import Login from './Login';
import Logged from './Logged';
import db from './db';
import { setSetting, settings } from './layout/Settings';
import { ThemeSwitchContext } from './utils/contexts';

const App: React.FC = () => {
    const [logged, setLogged] = useState(false);
    const [darkMode, setDarkMode] = useState(settings().darkMode);

    useEffect(() => {
        document.documentElement.className = darkMode ? 'theme-dark' : 'theme-light';
    }, [darkMode]);

    const handleLogin = useCallback(() => {
        setLogged(true);
    }, []);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('login');
        db.disconnect();
        setLogged(false);
    }, []);

    const themeSwitch = useCallback(() => {
        setDarkMode(prevDarkMode => {
            const newDarkMode = !prevDarkMode;
            setSetting('darkMode', newDarkMode);
            document.documentElement.className = newDarkMode ? 'theme-dark' : 'theme-light';
            return newDarkMode;
        });
    }, []);

    return (
        <>
            <ThemeSwitchContext.Provider value={themeSwitch}>
                {logged ? (
                    <Logged handleLogout={handleLogout} darkMode={darkMode} />
                ) : (
                    <Login handleLogin={handleLogin} darkMode={darkMode} />
                )}
            </ThemeSwitchContext.Provider>

            <footer className='footer page-footer'>
                <div className='content has-text-centered'>
                    <p>
                        <b>cypherGUI</b> by Michal Štefaňák. Awarded author of PHP Bolt driver.
                    </p>
                    <div className='buttons is-justify-content-center mt-2'>
                        <a
                            href='https://github.com/stefanak-michal/cyphergui'
                            target='_blank'
                            className='button is-small'
                        >
                            <span className='icon'>
                                <i className='fa-brands fa-github' />
                            </span>
                            <span>GitHub</span>
                        </a>
                        <a
                            href='https://www.linkedin.com/in/michalstefanak/'
                            target='_blank'
                            className='button is-small'
                        >
                            <span className='icon'>
                                <i className='fa-brands fa-linkedin' />
                            </span>
                            <span>LinkedIn</span>
                        </a>
                        <a
                            href='https://eu.mixpanel.com/p/XtoyTU92SmmpUaweP7DUAn'
                            target='_blank'
                            className='button is-small'
                        >
                            <span className='icon'>
                                <i className='fa-solid fa-chart-simple' />
                            </span>
                            <span>Analytics</span>
                        </a>
                    </div>
                </div>
            </footer>
        </>
    );
};

export default App;
