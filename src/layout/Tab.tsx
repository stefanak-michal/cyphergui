import * as React from "react";

interface ITabProps {
    id: string;
    active: boolean;
    icon?: string;
    title: string;
    handleClick: (id: string) => void;
    handleRemove: (id: string, e?: any) => void;
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
            <li className={this.props.active ? "is-active" : ""} onClick={() => this.props.handleClick(this.props.id)} onMouseEnter={this.showDelete} onMouseLeave={this.showDelete}>
                <a>
                    {this.props.icon && (
                        <span className="icon">
                            <i className={this.props.icon} aria-hidden="true" />
                        </span>
                    )}
                    <span>{this.props.title}</span>
                    {this.props.title !== "Start" && this.state.delete && <button className="delete is-small ml-3" onClick={e => this.props.handleRemove(this.props.id, e)} />}
                </a>
            </li>
        );
    }
}

export default Tab;
