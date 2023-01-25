import * as React from "react";
import { Relationship as _Relationship } from "neo4j-driver-core/types/graph-types";
import { ITabManager } from "../utils/interfaces";
import { Button, TypeButton } from "./form";
import db from "../db";
import { EPage } from "../utils/enums";
import { PropertiesModalContext } from "../utils/contexts";

export default class InlineRelationship extends React.Component<{ rel: _Relationship; tabManager: ITabManager; database?: string; small?: boolean }> {
    render() {
        return (
            <div className="is-flex is-align-items-center">
                <TypeButton type={this.props.rel.type} database={this.props.database || db.database} tabManager={this.props.tabManager} size={"mr-1 " + (!!this.props.small ? "" : "is-medium")} />
                <Button
                    onClick={() =>
                        this.props.tabManager.add({ prefix: "Rel", i: this.props.rel.identity }, "fa-regular fa-pen-to-square", EPage.Rel, {
                            id: db.getId(this.props.rel),
                            database: db.database,
                        })
                    }
                    icon="fa-solid fa-pen-clip"
                    color={!!this.props.small ? "is-small" : ""}
                    text={"#" + db.strInt(this.props.rel.identity)}
                />
                {Object.keys(this.props.rel.properties).length > 0 && (
                    <PropertiesModalContext.Consumer>
                        {fn => <Button icon="fa-solid fa-rectangle-list" onClick={() => fn(this.props.rel.properties)} color={"ml-1 " + (!!this.props.small ? "is-small" : "")} />}
                    </PropertiesModalContext.Consumer>
                )}
            </div>
        );
    }
}
