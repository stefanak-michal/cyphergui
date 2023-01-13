import * as React from "react";
import db from "../db";
import { Button } from "../components/form";
import { ITabManager } from "../utils/interfaces";
import { EPage } from "../utils/enums";

interface INavbarProps {
    handleLogout: () => void;
    handleOpenSettings: () => void;
    tabManager: ITabManager;
}

interface INavbarState {
    open: boolean;
    databases: string[];
    activeDb: string;
}

/**
 * Navbar
 */
class Navbar extends React.Component<INavbarProps, INavbarState> {
    state: INavbarState = {
        open: false,
        databases: [],
        activeDb: "",
    };

    componentDidMount() {
        this.setState({
            databases: db.databases,
            activeDb: db.database,
        });

        db.registerChangeActiveDatabaseCallback(db => {
            this.setState({ activeDb: db });
        });
        db.registerChangeDatabasesCallback(databases => {
            this.setState({ databases: databases });
        });
    }

    handleOpen = () => {
        this.setState(state => {
            return {
                open: !state.open,
            };
        });
    };

    render() {
        return (
            <nav className="navbar" role="navigation" aria-label="main navigation">
                <div className="navbar-brand">
                    <span className="navbar-item">
                        <img src="logo.svg" alt="cypherGUI" />
                    </span>

                    <a
                        href="#"
                        role="button"
                        className={"navbar-burger " + (this.state.open ? "is-active" : "")}
                        aria-label="menu"
                        aria-expanded="false"
                        data-target="basicNavbar"
                        onClick={this.handleOpen}>
                        <span aria-hidden="true"></span>
                        <span aria-hidden="true"></span>
                        <span aria-hidden="true"></span>
                    </a>
                </div>

                <div id="basicNavbar" className={"navbar-menu " + (this.state.open ? "is-active" : "")}>
                    <div className="navbar-start">
                        {this.state.databases.length > 1 && (
                            <div className="navbar-item has-dropdown is-hoverable">
                                <a className="navbar-link">{this.state.activeDb}</a>
                                <div className="navbar-dropdown">
                                    {this.state.databases.map(name => (
                                        <a
                                            key={"navbar-item-" + name}
                                            className={(this.state.activeDb === name ? "is-active" : "") + " navbar-item"}
                                            onClick={() => {
                                                db.database = name;
                                            }}>
                                            {name}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="navbar-end">
                        <div className="navbar-item">
                            <div className="buttons">
                                <Button icon="fa-regular fa-plus" text="Query" onClick={() => this.props.tabManager.add({ prefix: "Query" }, "fa-solid fa-terminal", EPage.Query)} color="is-info" />
                                <Button icon="fa-solid fa-clock-rotate-left" onClick={() => this.props.tabManager.add("History", "fa-solid fa-clock-rotate-left", EPage.History)} />
                                <Button icon="fa-solid fa-gears" onClick={this.props.handleOpenSettings} />
                                <Button onClick={this.props.handleLogout} text="Log out" />
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        );
    }
}

export default Navbar;
