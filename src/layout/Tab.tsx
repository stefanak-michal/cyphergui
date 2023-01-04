import * as React from "react";

interface ITabProps {
    active: boolean;
    icon?: string;
    title: string;
    handleClick: (title: string) => void;
    handleRemove: (title: string, e?: any) => void;
}

/**
 * Tab header
 */
class Tab extends React.Component<ITabProps> {
    state = {
        delete: false,
    };

    showDelete = (e: React.MouseEvent) => {
        this.setState({ delete: e.type === "mouseenter" });
    };

    render() {
        return (
            <li className={this.props.active ? "is-active" : ""} onClick={() => this.props.handleClick(this.props.title)} onMouseEnter={this.showDelete} onMouseLeave={this.showDelete}>
                <a href="#">
                    {this.props.icon && (
                        <span className="icon is-small">
                            <i className={this.props.icon} aria-hidden="true"></i>
                        </span>
                    )}
                    <span>{this.props.title}</span>
                    {this.props.title !== "Start" && this.state.delete && <button className="delete is-small ml-3" onClick={e => this.props.handleRemove(this.props.title, e)}></button>}
                </a>
            </li>
        );
    }
}

export default Tab;
