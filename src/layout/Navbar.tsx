import * as React from "react";
import db from "../db";

interface INavbarProps {
    handleLogout: () => void;
    handleAddQueryTab: () => void;
    handleOpenSettings: () => void;
}

interface INavbarState {
    open: boolean;
    databases: string[];
    activeDb: string;
}

/**
 * Navbar
 * @todo change logo and title
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
                    <span className="navbar-item icon-text is-size-3">
                        <span className="icon is-large">
                            <i className="fa-solid fa-cloud-bolt "></i>
                        </span>
                        <span>BOLT ADMIN</span>
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
                                <a className="navbar-link">DB</a>
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
                                <button className="button is-info" onClick={this.props.handleAddQueryTab}>
                                    <span className="icon">
                                        <i className="fas fa-plus" aria-hidden="true"></i>
                                    </span>
                                    <strong>Query</strong>
                                </button>
                                <button className="button" onClick={this.props.handleOpenSettings}>
                                    <span className="icon">
                                        <i className="fa-solid fa-gears" aria-hidden="true"></i>
                                    </span>
                                </button>
                                <button className="button" onClick={this.props.handleLogout}>
                                    Log out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        );
    }
}

export default Navbar;
