import { useState, useEffect, useContext, useActionState } from 'react';
import { Button, Checkbox } from './components/form';
import db from './db';
import { Driver } from 'neo4j-driver-lite';
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
    const [mixedContentInfo, setMixedContentInfo] = useState(false);
    const themeSwitch = useContext(ThemeSwitchContext);

    useEffect(() => {
        const initialize = async () => {
            const login = localStorage.getItem('login');
            if (login) {
                try {
                    const parsed = JSON.parse(login);
                    await tryConnect(url, parsed.username, parsed.password);
                } catch (err) {
                    localStorage.removeItem('login');
                    console.error(err);
                }
            }
        };

        initialize();
    }, []);

    const handleSubmit = async (): Promise<string | void> => {
        try {
            await tryConnect(url, username, password);
        } catch (err) {
            return err.message;
        }
    };

    const [formState, formAction, formPending] = useActionState(handleSubmit, null);

    const tryConnect = async (url: string, username: string, password: string): Promise<void> => {
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
            throw new Error('[' + err.name + '] ' + err.message);
        }

        try {
            await db.setDriver(driver);
            localStorage.setItem('host', url);
            if (remember) {
                localStorage.setItem(
                    'login',
                    JSON.stringify({
                        username: username,
                        password: password,
                    })
                );
            }
            handleLogin();
        } catch (err) {
            throw new Error('[' + err.name + '] ' + err.message);
        }
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

    const logo = new URL('./assets/logo.png', import.meta.url);
    const logo_dark = new URL('./assets/logo_dark.png', import.meta.url);

    document.title = 'Login / cypherGUI';
    return (
        <section className='mt-5 container is-fluid'>
            <div className='columns'>
                <div className='column is-6-desktop is-offset-3-desktop'>
                    <h1 className='has-text-centered'>
                        <img src={(darkMode ? logo_dark : logo).toString()} alt='cypherGUI' />
                    </h1>

                    <form id='login' className='mt-6 box' action={formAction}>
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
                        {formState && <div className='notification is-danger mt-3 mb-0'>{formState}</div>}
                        <div className='buttons mt-3 is-justify-content-space-between'>
                            <Button
                                text='Login'
                                icon='fa-solid fa-check'
                                color={'is-primary ' + (formPending ? 'is-loading' : '')}
                                type='submit'
                                disabled={formPending}
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
