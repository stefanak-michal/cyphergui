import * as React from "react";

export class Logo extends React.Component {
    render() {
        return (
            <>
                <span className="icon is-medium mr-2" style={{ color: "#FF632A" }}>
                    <i className="fa-solid fa-bolt" />
                </span>
                <span className="has-text-weight-bold " style={{ color: "#FF632A" }}>
                    Bolt
                </span>
                <span className="has-text-weight-bold" style={{ color: "black" }}>
                    Admin
                </span>
            </>
        );
    }
}
