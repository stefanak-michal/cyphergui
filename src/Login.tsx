import * as React from "react";
import { Button, Checkbox, Input } from "./components/form";
import db from "./db";
import { Driver } from "neo4j-driver";
import logo from "./assets/logo.png";
import logo_dark from "./assets/logo_dark.png";
import { ThemeSwitchContext } from "./utils/contexts";

interface ILoginState {
    url: string;
    username: string;
    password: string;
    remember: boolean;
    submitted: boolean;
    error: string | null;
    mixedContentInfo: boolean;
}

interface ILoginProps {
    handleLogin: () => void;
    darkMode: boolean;
}

/**
 * Login page
 */
class Login extends React.Component<ILoginProps, ILoginState> {
    state: ILoginState = {
        url: localStorage.getItem("host") || "bolt://localhost:7687",
        username: "",
        password: "",
        remember: false,
        submitted: false,
        error: null,
        mixedContentInfo: false,
    };

    handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        this.setState({ submitted: true });

        this.tryConnect(this.state.url, this.state.username, this.state.password, err => {
            this.setState({
                submitted: false,
                error: err,
            });
        });
    };

    tryConnect = (url: string, username: string, password: string, onError: (error: string) => void) => {
        let driver: Driver;
        try {
            driver = db.neo4j.driver(url, username.length > 0 && password.length > 0 ? db.neo4j.auth.basic(username, password) : undefined, {
                userAgent: "stefanak-michal/cypherGUI",
            });
        } catch (err) {
            onError("[" + err.name + "] " + err.message);
            return;
        }

        db.setDriver(driver, err => {
            if (err) {
                onError("[" + err.name + "] " + err.message);
            } else {
                localStorage.setItem("host", url);
                if (this.state.remember) localStorage.setItem("login", JSON.stringify({ username: username, password: password }));
                this.props.handleLogin();
            }
        });
    };

    handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        e.preventDefault();
        const target = e.currentTarget;
        const value = e.currentTarget.type === "checkbox" ? target.checked : target.value;
        const name = target.name;

        let obj = {};
        obj[name] = value;
        if (name === "url") obj["mixedContentInfo"] = this.isMixedContent(value as string);
        this.setState(obj);
    };

    componentDidMount() {
        let login = localStorage.getItem("login");
        if (login) {
            try {
                let parsed = JSON.parse(login);
                this.tryConnect(this.state.url, parsed.username, parsed.password, () => {
                    localStorage.removeItem("login");
                });
            } catch (Error) {}
        }

        if (this.isMixedContent(this.state.url)) this.setState({ mixedContentInfo: true });
    }

    isMixedContent = (url: string): boolean => {
        try {
            const parser = new URL(url);
            if (location.protocol === "https:" && (parser.protocol === "bolt:" || parser.protocol === "neo4j:")) return true;
        } catch (Error) {}
        return false;
    };

    render() {
        document.title = "Login / cypherGUI";
        return (
            <section className="mt-5 container is-fluid">
                <div className="columns">
                    <div className="column is-6-desktop is-offset-3-desktop">
                        <h1 className="has-text-centered">
                            <img src={this.props.darkMode ? logo_dark : logo} alt="cypherGUI" />
                        </h1>

                        <form id="login" className="mt-6 box" onSubmit={this.handleSubmit}>
                            <Input label="URL" name="url" onChange={this.handleInputChange} value={this.state.url} />
                            {this.state.mixedContentInfo && (
                                <div className="notification is-warning my-3">
                                    <i className="fa-solid fa-triangle-exclamation mr-1"></i>
                                    Not encrypted protocol won't work on encrypted website (https) because of <a href="https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content" target="_blank" referrerPolicy="no-referrer">mixed content</a>.
                                    You can run cypherGUI <a href="https://github.com/stefanak-michal/cyphergui/blob/master/README.md#local-instance" target="_blank">locally</a> or add certificate to your graph database instance.
                                    Adding certificate is a complex issue and you can read more about it <a href="https://ko-fi.com/post/Neo4j-and-self-signed-certificate-on-Windows-S6S2I0KQT" target="_blank">here</a>.
                                </div>
                            )}
                            <Input label="Username" name="username" onChange={this.handleInputChange} value={this.state.username} focus={true} />
                            <Input label="Password" name="password" type="password" onChange={this.handleInputChange} />
                            <Checkbox
                                name="remember"
                                label="Remember (not secure)"
                                checked={this.state.remember}
                                color="is-primary"
                                onChange={() =>
                                    this.setState(state => {
                                        return { remember: !state.remember };
                                    })
                                }
                            />
                            {this.state.error && <div className="notification is-danger mt-3 mb-0">{this.state.error}</div>}
                            <div className="buttons mt-3 is-justify-content-space-between">
                                <Button text="Login" icon="fa-solid fa-check" color={"is-primary " + (this.state.submitted ? "is-loading" : "")} type="submit" />
                                <ThemeSwitchContext.Consumer>
                                    {themeSwitch => <Button icon="fa-solid fa-circle-half-stroke" title="Dark mode switch" onClick={themeSwitch} />}
                                </ThemeSwitchContext.Consumer>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        );
    }
}

export default Login;
