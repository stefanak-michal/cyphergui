import * as React from "react";
import { Button, LabelButton } from "./form";
import db from "../db";
import { EPage } from "../utils/enums";
import { Node as _Node } from "neo4j-driver-lite";
import { ITabManager } from "../utils/interfaces";
import { PropertiesModalContext } from "../utils/contexts";

export default class InlineNode extends React.Component<{ node: _Node; tabManager: ITabManager; database?: string; small?: boolean }> {
    render() {
        return (
            <div className="is-flex is-align-items-center">
                {this.props.node.labels.map(label => (
                    <LabelButton key={label} label={label} database={this.props.database || db.database} tabManager={this.props.tabManager} size={"mr-1 " + (!!this.props.small ? "is-small" : "is-medium")} />
                ))}
                <Button
                    onClick={() =>
                        this.props.tabManager.add({ prefix: "Node", i: this.props.node.identity }, "fa-solid fa-pen-to-square", EPage.Node, {
                            id: db.getId(this.props.node),
                            database: this.props.database || db.database,
                        })
                    }
                    icon="fa-solid fa-pen-clip"
                    color={!!this.props.small ? "is-small" : ""}
                    text={"#" + db.strInt(this.props.node.identity)}
                />
                <PropertiesModalContext.Consumer>
                    {fn => <Button icon="fa-solid fa-rectangle-list" onClick={() => fn(this.props.node.properties)} color={"ml-1 " + (!!this.props.small ? "is-small" : "")} title="Properties" />}
                </PropertiesModalContext.Consumer>
            </div>
        );
    }
}
