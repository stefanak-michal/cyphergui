import * as React from "react";
import "./main.sass";
import Login from "./Login";
import Logged from "./Logged";
import db from "./db";

class App extends React.Component {
    state = {
        logged: false,
    };

    handleLogin = () => {
        this.setState({
            logged: true,
        });
    };

    handleLogout = () => {
        localStorage.removeItem("login");
        db.disconnect();
        this.setState({
            logged: false,
        });
    };

    render() {
        return (
            <>
                {this.state.logged ? <Logged handleLogout={this.handleLogout} /> : <Login handleLogin={this.handleLogin} />}

                <footer className="footer">
                    <div className="content has-text-centered">
                        <p>
                            <b>cypherGUI</b> by Michal Stefanak. Awarded author of PHP Bolt driver.
                        </p>
                        <div className="buttons is-justify-content-center mt-2">
                            <a href="https://github.com/stefanak-michal/cyphergui" target="_blank" className="button is-small">
                                <span className="icon is-small">
                                    <i className="fa-brands fa-github" />
                                </span>
                                <span>GitHub</span>
                            </a>
                            <a href="https://www.linkedin.com/in/michalstefanak/" target="_blank" className="button is-small">
                                <span className="icon is-small">
                                    <i className="fa-brands fa-linkedin" />
                                </span>
                                <span>LinkedIn</span>
                            </a>
                        </div>
                    </div>
                </footer>
            </>
        );
    }
}

export default App;
