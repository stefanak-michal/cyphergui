import { useState, useEffect, useContext } from 'react';
import { Button, Checkbox } from './components/form';
import db from './db';
import { Driver } from 'neo4j-driver-lite';
import logo from './assets/logo.png';
import logo_dark from './assets/logo_dark.png';
import { ThemeSwitchContext } from './utils/contexts';

interface ILoginProps {
    handleLogin: () => void;
    darkMode: boolean;
}

const Login: React.FC<ILoginProps> = ({ handleLogin, darkMode }) => {
    const [url, setUrl] = useState(localStorage.getItem('host') || 'bolt://localhost:7687');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mixedContentInfo, setMixedContentInfo] = useState(false);
    const themeSwitch = useContext(ThemeSwitchContext);

    useEffect(() => {
        const login = localStorage.getItem('login');
        if (login) {
            try {
                const parsed = JSON.parse(login);
                tryConnect(url, parsed.username, parsed.password, () => {
                    localStorage.removeItem('login');
                });
            } catch (err) {
                console.error(err);
            }
        }

        if (isMixedContent(url)) setMixedContentInfo(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);

        tryConnect(url, username, password, err => {
            setSubmitted(false);
            setError(err);
        });
    };

    const tryConnect = (url: string, username: string, password: string, onError: (error: string) => void) => {
        let driver: Driver;
        try {
            driver = db.neo4j.driver(
                url,
                username.length > 0 && password.length > 0 ? db.neo4j.auth.basic(username, password) : undefined,
                {
                    userAgent: 'stefanak-michal/cypherGUI',
                }
            );
        } catch (err) {
            onError('[' + err.name + '] ' + err.message);
            return;
        }

        db.setDriver(driver, err => {
            if (err) {
                onError('[' + err.name + '] ' + err.message);
            } else {
                localStorage.setItem('host', url);
                if (remember)
                    localStorage.setItem(
                        'login',
                        JSON.stringify({
                            username: username,
                            password: password,
                        })
                    );
                handleLogin();
            }
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        e.preventDefault();
        const target = e.currentTarget;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;

        if (name === 'url') {
            setUrl(value as string);
            setMixedContentInfo(isMixedContent(value as string));
        } else if (name === 'username') {
            setUsername(value as string);
        } else if (name === 'password') {
            setPassword(value as string);
        } else if (name === 'remember') {
            setRemember(value as boolean);
        }
    };

    const isMixedContent = (url: string): boolean => {
        try {
            const parser = new URL(url);
            if (location.protocol === 'https:' && (parser.protocol === 'bolt:' || parser.protocol === 'neo4j:'))
                return true;
        } catch (err) {
            console.error(err);
        }
        return false;
    };

    document.title = 'Login / cypherGUI';
    return (
        <section className='mt-5 container is-fluid'>
            <div className='columns'>
                <div className='column is-6-desktop is-offset-3-desktop'>
                    <h1 className='has-text-centered'>
                        <img src={darkMode ? logo_dark : logo} alt='cypherGUI' />
                    </h1>

                    <form id='login' className='mt-6 box' onSubmit={handleSubmit}>
                        <div className='field'>
                            <label className='label' htmlFor='input-url'>
                                URL
                            </label>
                            <div className='control'>
                                <input
                                    id='input-url'
                                    className='input'
                                    name='url'
                                    type='text'
                                    onChange={handleInputChange}
                                    value={url}
                                />
                            </div>
                        </div>

                        {mixedContentInfo && (
                            <div className='notification is-warning my-3'>
                                <i className='fa-solid fa-triangle-exclamation mr-1'></i>
                                Not encrypted protocol won't work on encrypted website (https) because of{' '}
                                <a
                                    href='https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content'
                                    target='_blank'
                                    referrerPolicy='no-referrer'
                                >
                                    mixed content
                                </a>
                                . You can run cypherGUI{' '}
                                <a
                                    href='https://github.com/stefanak-michal/cyphergui/blob/master/README.md#local-instance'
                                    target='_blank'
                                >
                                    locally
                                </a>{' '}
                                or add certificate to your graph database instance. Adding certificate is a complex
                                issue and you can read more about it{' '}
                                <a
                                    href='https://ko-fi.com/post/Neo4j-and-self-signed-certificate-on-Windows-S6S2I0KQT'
                                    target='_blank'
                                >
                                    here
                                </a>
                                .
                            </div>
                        )}

                        <div className='field'>
                            <label className='label' htmlFor='input-username'>
                                Username
                            </label>
                            <div className='control'>
                                <input
                                    id='input-username'
                                    className='input'
                                    name='username'
                                    type='text'
                                    onChange={handleInputChange}
                                    value={username}
                                    autoFocus={true}
                                />
                            </div>
                        </div>

                        <div className='field'>
                            <label className='label' htmlFor='input-password'>
                                Password
                            </label>
                            <div className='control'>
                                <input
                                    id='input-password'
                                    className='input'
                                    name='password'
                                    type='password'
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <Checkbox
                            name='remember'
                            label='Remember me (not secure)'
                            checked={remember}
                            color='is-primary'
                            onChange={() => setRemember(r => !r)}
                        />
                        {error && <div className='notification is-danger mt-3 mb-0'>{error}</div>}
                        <div className='buttons mt-3 is-justify-content-space-between'>
                            <Button
                                text='Login'
                                icon='fa-solid fa-check'
                                color={'is-primary ' + (submitted ? 'is-loading' : '')}
                                type='submit'
                            />
                            <Button
                                icon='fa-solid fa-circle-half-stroke'
                                title='Dark mode switch'
                                onClick={themeSwitch}
                            />
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default Login;
