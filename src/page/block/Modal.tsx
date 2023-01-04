import * as React from "react";

export default class Modal extends React.Component<{ title: string; color?: string; handleClose: () => void; children: React.ReactNode }> {
    render() {
        return (
            <div className="modal is-active">
                <div className="modal-background"></div>
                <div className="modal-content">
                    <div className={"message " + (this.props.color || "")}>
                        <div className="message-header">
                            <p>{this.props.title}</p>
                            <button className="delete" aria-label="delete" onClick={this.props.handleClose}></button>
                        </div>
                        <div className="message-body">{this.props.children}</div>
                    </div>
                </div>
            </div>
        );
    }
}
