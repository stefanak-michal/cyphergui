import * as React from "react";
import { IEdgeBase, INodeBase, INodeStyle, IEdgeStyle, NodeShapeType, Orb, OrbEventType } from "@memgraph/orb";
import db from "../../db";
import { Node as _Node, Record, Relationship as _Relationship } from "neo4j-driver";
import { Button } from "../../components/form";
import orb_logo from "../../assets/orb_logo.png";
import { ITabManager } from "../../utils/interfaces";
import { settings } from "../../layout/Settings";

const COLORS = ['#604A0E', '#C990C0', '#F79767', '#57C7E3', '#F16667', '#D9C8AE', '#8DCC93', '#ECB5C9', '#4C8EDA', '#FFC454', '#DA7194', '#569480'];

interface MyNode extends INodeBase {
    id: string;
    label: string;
    element: _Node;
}

interface MyEdge extends IEdgeBase {
    id: string;
    label: string;
    start: any;
    end: any;
    element: _Relationship;
}

interface IOrbSettings {
    labelStyles: {
        [label: string]: INodeStyle
    }
}

interface IGraphProps {
    rows: Record[];
    tabManager: ITabManager
}

interface IGraphState {
    sidebarVisible: number; // 1 - visible, 0 - hidden, 2 - animate in, 3 - animate out
    labels: { [key: string]: number }; // label: amount of nodes with it
    types: { [key: string]: number }; // type: amount of rels with it
    detail: _Node | _Relationship | null; // clicked node/rel to see details in sidebar
}

class Graph extends React.Component<IGraphProps, IGraphState> {
    state: IGraphState = {
        sidebarVisible: 1,
        labels: {},
        types: {},
        detail: null
    };

    graphContainer = React.createRef<HTMLDivElement>();
    graphElement = React.createRef<HTMLDivElement>();
    orb: Orb;

    // todo use sessionStorage to hold these settings
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage
    orbSettings: IOrbSettings = {
        labelStyles: {},
        // typeStyles: {}
    };

    componentDidMount() {
        this.initGraphView();
    }

    initGraphView = () => {
        const current = this.graphElement.current;
        if (!current) return;

        this.initializeOrb();

        const nodes: MyNode[] = [];
        const edges: MyEdge[] = [];
        const labels: { [key: string]: number } = {};
        const types: { [key: string]: number } = {};
        this.props.rows.forEach(row => {
            for (let key of row.keys) {
                const value = row.get(key);
                if (value instanceof _Node && !nodes.find(n => n.id === db.strInt(value.identity))) {
                    //prepare data for orb
                    nodes.push({
                        id: db.strInt(value.identity),
                        label: ":" + value.labels.join(":"),
                        element: value
                    });
                    //collect labels with counts
                    value.labels.forEach(label => {
                        if (!(label in labels))
                            labels[label] = 0;
                        labels[label]++;
                    });
                } else if (value instanceof _Relationship && !edges.find(e => e.id === db.strInt(value.identity))) {
                    //prepare data for orb
                    edges.push({
                        id: db.strInt(value.identity),
                        start: db.strInt(value.start),
                        end: db.strInt(value.end),
                        label: ":" + value.type,
                        element: value
                    });
                    //collect type with count
                    if (!(value.type in types))
                        types[value.type] = 0;
                    types[value.type]++;
                }
            }
        });

        this.setState({
            labels: labels,
            types: types
        });

        this.orb.data.setup({ nodes, edges });

        //remove unused labels
        Object.keys(this.orbSettings.labelStyles).forEach(label => {
            if (!(label in labels))
                delete labels[label];
        });
        //define missing styles for labels
        Object.keys(labels).forEach((label, i) => {
            if (!(label in this.orbSettings.labelStyles)) {
                this.orbSettings.labelStyles[label] = {
                    color: COLORS[i]
                };
            }
        });
        //apply label styles
        this.orb.data.getNodes().forEach(node => {
            node.style.color = this.orbSettings.labelStyles[node.data.element.labels[0]].color;
        });

        this.orb.view.setSettings({
            render: {
                shadowIsEnabled: false,
                shadowOnEventIsEnabled: true
            }
        });
        this.orb.view.render(() => {
            this.orb.view.recenter();
        });
    };

    initializeOrb = () => {
        if (!this.orb) {
            this.orb = new Orb<MyNode, MyEdge>(this.graphElement.current);
            this.orb.data.setDefaultStyle({
                getNodeStyle(node): INodeStyle {
                    return {
                        size: 5,
                        color: '#1d87c9',
                        fontSize: 4,
                        fontColor: settings().darkMode ? 'white' : 'black',
                        shape: NodeShapeType.CIRCLE,
                        fontFamily: 'Inter, Helvetica, Arial, sans-serif',
                        label: node.data.label,
                        shadowSize: 5,
                        shadowColor: 'black'
                    };
                },
                getEdgeStyle(edge): IEdgeStyle {
                    return {
                        color: '#ababab',
                        width: 0.3,
                        fontSize: 4,
                        arrowSize: 1,
                        fontColor: settings().darkMode ? 'white' : 'black',
                        fontFamily: 'Inter, Helvetica, Arial, sans-serif',
                        label: edge.data.label,
                    };
                }
            });

            this.orb.events.on(OrbEventType.NODE_CLICK, event => {
                this.setState({
                    detail: event.node.data.element
                });
            });

            this.orb.events.on(OrbEventType.EDGE_CLICK, event => {
                this.setState({
                    detail: event.edge.data.element
                });
            });

            this.orb.events.on(OrbEventType.MOUSE_CLICK, event => {
                if (!event.subject) {
                    this.setState({
                        detail: null
                    });
                }
            })
        }
    }

    sidebarSwitchBtn = () => {
        if (this.state.sidebarVisible <= 1) {
            this.setState(state => {
                return { sidebarVisible: state.sidebarVisible === 1 ? 3 : 2 };
            });
        }
    }

    render() {
        return (
            <div className="graph-container is-flex" ref={this.graphContainer}>
                <div className={"graph " + (this.state.sidebarVisible > 0 ? "sidebar-visible" : "")} ref={this.graphElement}>
                    {/* canvas will be inserted here */}
                    <div className="sidebar-switch-btn">
                        <Button
                            icon={"fa-solid " + (this.state.sidebarVisible % 2 === 1 ? "fa-chevron-right" : "fa-chevron-left")}
                            color="ml-auto is-small"
                            onClick={this.sidebarSwitchBtn}
                        />
                    </div>
                </div>

                {this.state.sidebarVisible > 0 && (
                    <div className={"sidebar px-2 py-3 "
                        + (this.state.sidebarVisible === 3 ? "animate_out" : "")
                        + (this.state.sidebarVisible === 2 ? "animate_in" : "")
                        } onAnimationEnd={() => {
                            this.setState(state => {
                                return { sidebarVisible: state.sidebarVisible === 3 ? 0 : 1 };
                            });
                            setTimeout(() => this.orb.view.recenter(), 100);
                    }}>
                        <div className="header has-text-weight-bold mb-3">
                            {this.state.detail instanceof _Node ? "Node" : (this.state.detail instanceof _Relationship ? "Relationship" : "Overview")}
                        </div>
                        <div className="content">
                            <SidebarContent
                                detail={this.state.detail}
                                labels={this.state.labels}
                                types={this.state.types}
                                orbSettings={this.orbSettings} />
                        </div>
                    </div>
                )}

                <div className="buttons">
                    {document.fullscreenEnabled && (
                        <Button
                            icon={"fa-solid " + (document.fullscreenElement === null ? "fa-expand" : "fa-compress")}
                            color="mr-0"
                            onClick={() => {
                                if (document.fullscreenElement === null) {
                                    this.graphContainer.current.requestFullscreen().then(() => {
                                        setTimeout(() => this.orb.view.recenter(), 100);
                                    });
                                } else {
                                    document.exitFullscreen().then(() => {
                                        setTimeout(() => this.orb.view.recenter(), 100);
                                    });
                                }
                            }}
                            title="Fullscreen"
                        />
                    )}
                    <Button icon="fa-solid fa-maximize" onClick={() => this.orb.view.recenter()} color="mr-0" title="Recenter" />
                </div>

                <div className="brand is-flex is-align-items-center">
                    <span className="is-size-7">Powered by</span>
                    <a href="https://github.com/memgraph/orb" target="_blank" className="ml-1">
                        <img src={orb_logo} alt="ORB" />
                    </a>
                </div>
            </div>
        );
    }
}

interface ISidebarProps {
    detail: _Node | _Relationship | null;
    labels: { [key: string]: number };
    types: { [key: string]: number };
    orbSettings: IOrbSettings
}

class SidebarContent extends React.Component<ISidebarProps, {}> {
    render() {
        if (this.props.detail === null) {
            //todo onclick option to change color and text size
            return (
                <>
                    {Object.keys(this.props.labels).length > 0 && (
                        <>
                            <div>Node Labels</div>
                            <span className="buttons">
                                {Object.keys(this.props.labels).map(label => (
                                    <Button
                                        color={"tag is-link is-rounded px-2 c"
                                            + COLORS.indexOf(this.props.orbSettings.labelStyles[label].color as string) }
                                        // onClick={() => }
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

export default Graph;
