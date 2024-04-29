import { Node as _Node, Relationship as _Relationship } from "neo4j-driver";
import * as React from "react";
import { Button } from "../../../components/form";
import { COLORS, IStyle } from "../Graph";

interface ISidebarProps {
    detail: _Node | _Relationship | null;
    labels: { [key: string]: number };
    types: { [key: string]: number };
    labelClick: (label: string) => void;
    nodeStyles: IStyle
}

class SidebarContent extends React.Component<ISidebarProps, {}> {
    render() {
        if (this.props.detail === null) {
            return (
                <>
                    {Object.keys(this.props.labels).length > 0 && (
                        <>
                            <div>Node Labels</div>
                            <span className="buttons">
                                {Object.keys(this.props.labels).map(label => (
                                    <Button
                                        color={"tag is-link is-rounded px-2 c"
                                            + (label in this.props.nodeStyles
                                                ? COLORS.indexOf(this.props.nodeStyles[label].color as string)
                                                : '0') }
                                        onClick={() => this.props.labelClick(label)}
                                        text={":" + label + " (" + this.props.labels[label] + ")"}
                                    />
                                ))}
                            </span>
                        </>
                    )}

                    {Object.keys(this.props.types).length > 0 && (
                        <>
                            <div>Relationship Types</div>
                            <span className="buttons">
                                {Object.keys(this.props.types).map(type => (
                                    <Button
                                        color={"tag is-info is-rounded px-2 has-text-white "}
                                        // onClick={() => }
                                        text={":" + type + " (" + this.props.types[type] + ")"}
                                    />
                                ))}
                            </span>
                        </>
                    )}
                </>
            );
        }

        if (this.props.detail instanceof _Node) {
            //todo stash button, labels (LabelButton?) and properties
            return (
                <>
                </>
            );
        }

        if (this.props.detail instanceof _Relationship) {
            //todo similar to _Node
            return (
                <>
                </>
            );
        }

        return undefined;
    }
}

export default SidebarContent;
