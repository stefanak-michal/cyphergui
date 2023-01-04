import * as React from "react";
import { Button, Input } from "./form";
import { neo4j, setDriver } from "./db";

/**
 * Login page
 * @todo add additional info
 * @todo update logo
 */
class Login extends React.Component<{ handleLogin: () => void }> {
    state = {
        url: "bolt://localhost:7687",
        username: "",
        password: "",
        submitted: false,
        error: null,
    };

    handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        this.setState({ submitted: true });

        try {
            let driver = neo4j.driver(this.state.url, neo4j.auth.basic(this.state.username, this.state.password), { userAgent: "bolt-admin" });

            //there is no better way how to verify credentials than running a first query?
            let session = driver.session();
            await session.run("RETURN 1 as num");
            await session.close();

            setDriver(driver);
            this.props.handleLogin();
        } catch (err) {
            console.log(err);
            this.setState({
                submitted: false,
                error: "[" + err.name + "] " + err.message,
            });
        }
    };

    handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        e.preventDefault();
        const target = e.currentTarget;
        const value = e.currentTarget.type === "checkbox" ? target.checked : target.value;
        const name = target.name;

        this.setState({
            [name]: value,
        });
    };

    componentDidMount() {
        this.setState({
            submitted: false,
            error: null,
        });
    }

    render() {
        return (
            <section className="mt-5 container is-fluid">
                <h1 className="title has-text-centered">Bolt Admin</h1>
                <form id="login" className="columns mt-6" onSubmit={this.handleSubmit}>
                    <div className="column is-one-third is-offset-one-third box">
                        <Input label="URL" name="url" onChange={this.handleInputChange} value={this.state.url} />
                        <Input label="Username" name="username" onChange={this.handleInputChange} value={this.state.username} />
                        <Input label="Password" name="password" type="password" onChange={this.handleInputChange} />
                        {this.state.error && <div className="notification is-danger">{this.state.error}</div>}
                        <Button text="Login" icon="fa-solid fa-bolt" color={"is-primary " + (this.state.submitted ? "is-loading" : "")} type="submit" />
                    </div>
                </form>
            </section>
        );
    }
}

export default Login;
