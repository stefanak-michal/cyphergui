import { Node as _Node, Relationship as _Relationship } from "neo4j-driver";
import * as React from "react";
import { IStyle } from "../Graph";

interface ISidebarProps {
    detail: _Node | _Relationship | null;
    labels: { [key: string]: number };
    types: { [key: string]: number };
    labelClick: (label: string) => void;
    typeClick: (type: string) => void;
    nodeStyles: IStyle;
    edgeStyles: IStyle;
}

class SidebarContent extends React.Component<ISidebarProps, {}> {
    isColorDark = (color: string): boolean => {
        color = color.replace('#', '');
        const rgb = parseInt(color, 16);   // convert rrggbb to decimal
        const r = (rgb >> 16) & 0xff;  // extract red
        const g = (rgb >>  8) & 0xff;  // extract green
        const b = (rgb >>  0) & 0xff;  // extract blue
        return (0.2126 * r + 0.7152 * g + 0.0722 * b) < 175; // per ITU-R BT.709
    }

    render() {
        if (this.props.detail === null) {
            return (
                <>
                    {Object.keys(this.props.labels).length > 0 && (
                        <>
                            <div>Node Labels</div>
                            <span className="buttons">
                                {Object.keys(this.props.labels).map(label => (
                                    <button className={"button tag is-rounded px-2 " + (this.isColorDark(this.props.nodeStyles[label].color) ? "has-text-white" : "")}
                                            style={{backgroundColor: this.props.nodeStyles[label].color}}
                                            onClick={() => this.props.labelClick(label)}>
                                        :{label} ({this.props.labels[label]})
                                    </button>
                                ))}
                            </span>
                        </>
                    )}

                    {Object.keys(this.props.types).length > 0 && (
                        <>
                            <div>Relationship Types</div>
                            <span className="buttons">
                                {Object.keys(this.props.types).map(type => (
                                    <button className={"button tag is-rounded px-2 " + (this.isColorDark(this.props.edgeStyles[type].color) ? "has-text-white" : "")}
                                            style={{backgroundColor: this.props.edgeStyles[type].color}}
                                            onClick={() => this.props.typeClick(type)}>
                                        :{type} ({this.props.types[type]})
                                    </button>
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
