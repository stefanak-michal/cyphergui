import * as React from "react";
import { Button, Checkbox, Input } from "./components/form";
import db from "./db";
import { Driver, QueryResult } from "neo4j-driver";
import logo from "./assets/logo.png";

interface ILoginState {
    url: string;
    username: string;
    password: string;
    remember: boolean;
    submitted: boolean;
    error: string | null;
    mixedContentInfo: boolean;
}

/**
 * Login page
 */
class Login extends React.Component<{ handleLogin: () => void }, ILoginState> {
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
            driver = db.neo4j.driver(url, username.length > 0 && password.length > 0 ? db.neo4j.auth.basic(username, password) : { scheme: "none", principal: null, credentials: null }, {
                userAgent: "stefanak-michal/cypherGUI",
            });
        } catch (err) {
            onError("[" + err.name + "] " + err.message);
            return;
        }

        const handleResponse = (response: QueryResult = null) => {
            db.setDriver(driver, err => {
                if (err) {
                    onError("[" + err.name + "] " + err.message);
                } else {
                    driver
                        .getServerInfo()
                        .then(r => {
                            db.hasElementId = r["protocolVersion"] >= 5 && (response ? "elementId" in response.records[0].get("n") : false);
                        })
                        .finally(() => {
                            localStorage.setItem("host", url);
                            if (this.state.remember) localStorage.setItem("login", JSON.stringify({ username: username, password: password }));
                            this.props.handleLogin();
                        });
                }
            });
        };

        driver
            .session({ defaultAccessMode: db.neo4j.session.READ })
            .run("MATCH (n) RETURN n LIMIT 1")
            .then(response => {
                if (response.records.length) {
                    handleResponse(response);
                } else {
                    const tx = driver.session({ defaultAccessMode: db.neo4j.session.WRITE }).beginTransaction();
                    tx.run("CREATE (n) RETURN n")
                        .then(response => {
                            handleResponse(response.records.length ? response : null);
                            tx.rollback();
                        })
                        .catch(() => {
                            handleResponse();
                        });
                }
            })
            .catch(err => {
                onError("[" + err.name + "] " + err.message);
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
                            <img src={logo} alt="cypherGUI" />
                        </h1>

                        <form id="login" className="mt-6 box" onSubmit={this.handleSubmit}>
                            <Input label="URL" name="url" onChange={this.handleInputChange} value={this.state.url} />
                            {this.state.mixedContentInfo && (
                                <div className="help mb-3">
                                    Not encrypted protocol won't work on encrypted website (https) because of
                                    <a href="https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content" target="_blank" className="pl-1" referrerPolicy="no-referrer">
                                        mixed content
                                    </a>
                                    . You can run cypherGUI
                                    <a href="https://github.com/stefanak-michal/cyphergui/blob/master/README.md#local-instance" target="_blank" className="px-1">
                                        locally
                                    </a>
                                    or add certificate to your graph database instance.
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
                            <Button text="Login" icon="fa-solid fa-check" color={"mt-3 is-primary " + (this.state.submitted ? "is-loading" : "")} type="submit" />
                        </form>
                    </div>
                </div>
            </section>
        );
    }
}

export default Login;
