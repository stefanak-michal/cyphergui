import * as React from "react";
import "./main.sass";
import Login from "./Login";
import Logged from "./Logged";
import db from "./db";
import { Button } from "./components/form";
import Modal from "./components/Modal";
import kofi_icon from "./assets/ko-fi_icon.png";

class App extends React.Component {
    state = {
        logged: false,
        uptimeModal: false,
    };

    uptimeInterval;

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

    componentDidMount() {
        if (!this.uptimeInterval) {
            this.uptimeInterval = setInterval(() => {
                const min = parseInt(localStorage.getItem("uptime") || "0") + 1;
                localStorage.setItem("uptime", min.toString());
                if (min % 60 === 0) {
                    this.setState({
                        uptimeModal: true,
                    });
                }
            }, 1000 * 60);
        }
    }

    render() {
        return (
            <>
                {this.state.logged ? <Logged handleLogout={this.handleLogout} /> : <Login handleLogin={this.handleLogin} />}

                {this.state.uptimeModal && (
                    <Modal title="Support" handleClose={() => this.setState({ uptimeModal: false })} color="is-info">
                        <p className="mb-2">It is amazing you have been using this project for {Math.floor(parseInt(localStorage.getItem("uptime") || "0") / 60)} hours.</p>
                        <p className="mb-2">
                            This project was made with <i className="fa-solid fa-heart has-text-danger" title="Heart" /> and for free but as you guess it costs
                            <i className="fa-solid fa-clock has-text-link mx-1" title="Time" />
                            and I would like to add new features and take <i className="fa-solid fa-hand-holding-medical" title="Care" /> of it.
                        </p>
                        <p>Please consider support with Ko-fi donate button, GitHub sponsors or at least with star at GitHub repository.</p>
                        <div className="buttons is-justify-content-flex-end mt-3">
                            <a href="https://ko-fi.com/michalstefanak" target="_blank" className="button is-link pl-5">
                                <span className="icon mr-2">
                                    <img src={kofi_icon} alt="ko-fi" className="kofi-tada" />
                                </span>
                                <span>Ko-fi</span>
                            </a>
                            <a href="https://github.com/stefanak-michal/cyphergui" target="_blank" className="button is-link">
                                <span className="icon">
                                    <i className="fa-brands fa-github" />
                                </span>
                                <span>GitHub</span>
                            </a>
                            <Button text="Close" icon="fa-solid fa-xmark" onClick={() => this.setState({ uptimeModal: false })} color="is-secondary" />
                        </div>
                    </Modal>
                )}

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
