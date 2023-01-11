import * as React from "react";
import { Button, Checkbox, Input } from "./components/form";
import db from "./db";
import { Driver } from "neo4j-driver";
import { Logo } from "./components/html";

interface ILoginData {
    url: string;
    username: string;
    password: string;
}

interface ILoginState {
    url: string;
    username: string;
    password: string;
    remember: boolean;
    submitted: boolean;
    error: string | null;
}

/**
 * Login page
 * @todo add additional info
 * @todo update logo
 */
class Login extends React.Component<{ handleLogin: () => void }, ILoginState> {
    state: ILoginState = {
        url: "bolt://localhost:7687",
        username: "",
        password: "",
        remember: false,
        submitted: false,
        error: null,
    };

    handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        this.setState({ submitted: true });

        this.tryConnect(this.state.url, this.state.username, this.state.password, err => {
            console.log(err);
            this.setState({
                submitted: false,
                error: err,
            });
        });
    };

    tryConnect = (url: string, username: string, password: string, onError: (error: string) => void) => {
        let driver: Driver;
        try {
            driver = db.neo4j.driver(url, username.length > 0 && password.length > 0 ? db.neo4j.auth.basic(username, password) : { scheme: "none", principal: "", credentials: "" }, {
                userAgent: "bolt-admin",
            });
        } catch (err) {
            onError("[" + err.name + "] " + err.message);
            return;
        }

        driver
            .session({ defaultAccessMode: db.neo4j.session.WRITE })
            .run("CREATE (n) DELETE n RETURN n")
            .then(response => {
                if (response.records.length) {
                    db.setDriver(driver, () => {
                        db.hasElementId = "elementId" in response.records[0].get("n");
                        if (this.state.remember) localStorage.setItem("login", JSON.stringify({ url: url, username: username, password: password } as ILoginData));
                        this.props.handleLogin();
                    });
                } else {
                    onError("Initial test query wasn't successful");
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
        this.setState(obj);
    };

    componentDidMount() {
        let login = localStorage.getItem("login");
        if (!!login) {
            let parsed = JSON.parse(login) as ILoginData;
            this.tryConnect(parsed.url, parsed.username, parsed.password, () => {
                localStorage.removeItem("login");
            });
        }
    }

    render() {
        document.title = "Login | BoltAdmin";
        return (
            <section className="mt-5 container is-fluid">
                <h1 className="has-text-centered is-size-2">
                    <Logo />
                </h1>
                <form id="login" className="columns mt-6" onSubmit={this.handleSubmit}>
                    <div className="column is-one-third is-offset-one-third box">
                        <Input label="URL" name="url" onChange={this.handleInputChange} value={this.state.url} />
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
                        {this.state.error && <div className="notification is-danger">{this.state.error}</div>}
                        <Button text="Login" icon="fa-solid fa-check" color={"mt-3 is-primary " + (this.state.submitted ? "is-loading" : "")} type="submit" />
                    </div>
                </form>
            </section>
        );
    }
}

export default Login;
