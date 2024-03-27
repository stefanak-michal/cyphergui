import * as React from "react";
import "./main.sass";
import Login from "./Login";
import Logged from "./Logged";
import db from "./db";
import { setSetting, settings } from "./layout/Settings";
import { ThemeSwitchContext } from "./utils/contexts";

interface IAppState {
    logged: boolean;
    darkMode: boolean;
}

class App extends React.Component<{}, IAppState> {
    state = {
        logged: false,
        darkMode: settings().darkMode
    };

    componentDidMount() {
        if (this.state.darkMode) document.documentElement.className = "theme-dark";
    }

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

    themeSwitch = () => {
        this.setState(state => {
            return { darkMode: !state.darkMode };
        }, () => {
            setSetting('darkMode', this.state.darkMode);
            document.documentElement.className = this.state.darkMode ? "theme-dark" : "";
        });
    };

    render() {
        return (
            <>
                <ThemeSwitchContext.Provider value={this.themeSwitch} >
                    {this.state.logged
                        ? <Logged handleLogout={this.handleLogout} darkMode={this.state.darkMode} />
                        : <Login handleLogin={this.handleLogin} darkMode={this.state.darkMode} />}
                </ThemeSwitchContext.Provider>

                <footer className="footer page-footer">
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
