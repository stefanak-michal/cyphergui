import * as React from "react";
import { Button, LabelButton } from "./form";
import db from "../db";
import { EPage } from "../utils/enums";
import { Node as _Node } from "neo4j-driver";
import { ITabManager } from "../utils/interfaces";
import { PropertiesModal } from "./Modal";

interface IInlineNodeState {
    propertiesModal: boolean;
}

export default class InlineNode extends React.Component<{ node: _Node; tabManager: ITabManager; database?: string; small?: boolean }, IInlineNodeState> {
    state: IInlineNodeState = {
        propertiesModal: false,
    };

    render() {
        return (
            <>
                {this.state.propertiesModal && <PropertiesModal properties={this.props.node.properties} handleClose={() => this.setState({ propertiesModal: false })} />}

                <div className="is-flex is-align-items-center is-justify-content-flex-start">
                    {this.props.node.labels.map(label => (
                        <LabelButton
                            key={label}
                            label={label}
                            database={this.props.database || db.database}
                            tabManager={this.props.tabManager}
                            size={"mr-1 " + (!!this.props.small ? "" : "is-medium")}
                        />
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
                        text={"#" + db.strId(this.props.node.identity)}
                    />
                    {Object.keys(this.props.node.properties).length > 0 && (
                        <Button icon="fa-solid fa-rectangle-list" onClick={() => this.setState({ propertiesModal: true })} color={"ml-1 " + (!!this.props.small ? "is-small" : "")} />
                    )}
                </div>
            </>
        );
    }
}
