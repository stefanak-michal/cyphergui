import * as React from "react";
import { Orb, OrbEventType } from "@memgraph/orb";
import db from "../../db";
import { Node as _Node, Record, Relationship as _Relationship } from "neo4j-driver";
import { Button } from "../../components/form";
import orb_logo from "../../assets/orb_logo.png";
import { ITabManager } from "../../utils/interfaces";

interface MyNode {
    id: string;
    label: string;
}

interface MyEdge {
    id: string;
    label: string;
    start: any;
    end: any;
}

interface IGraphProps {
    rows: Record[];
    tabManager: ITabManager
}

interface IGraphState {
    sidebarVisible: number; // 1 - visible, 0 - hidden, 2 - animate in, 3 - animate out
    labels: { [key: string]: number }; // label: amount of nodes with it
    types: { [key: string]: number }; // type: amount of rels with it
    detail: _Node | _Relationship | null;
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
    collection: { [identity: string]: _Node | _Relationship } = {};

    componentDidMount() {
        this.initGraphView();
    }

    initGraphView = () => {
        const current = this.graphElement.current;
        if (!current) return;

        if (!this.orb) {
            this.orb = new Orb<MyNode, MyEdge>(current);

            this.orb.events.on(OrbEventType.NODE_CLICK, event => {
                this.setState({
                    detail: this.collection[event.node.data.id] || null
                });
            });

            this.orb.events.on(OrbEventType.EDGE_CLICK, event => {
                this.setState({
                    detail: this.collection[event.edge.data.id] || null
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

        const nodes: MyNode[] = [];
        const edges: MyEdge[] = [];
        const labels: { [key: string]: number } = {};
        const types: { [key: string]: number } = {};
        this.props.rows.forEach(row => {
            for (let key of row.keys) {
                const value = row.get(key);
                if (value instanceof _Node && !nodes.find(n => n.id === db.strInt(value.identity))) {
                    nodes.push({
                        id: db.strInt(value.identity),
                        label: ":" + value.labels.join(":")
                    });
                    value.labels.forEach(label => {
                        if (!(label in labels))
                            labels[label] = 0;
                        labels[label]++;
                    });
                    this.collection[db.strInt(value.identity)] = value;
                } else if (value instanceof _Relationship && !edges.find(e => e.id === db.strInt(value.identity))) {
                    edges.push({
                        id: db.strInt(value.identity),
                        start: db.strInt(value.start),
                        end: db.strInt(value.end),
                        label: ":" + value.type
                    });
                    if (!(value.type in types))
                        types[value.type] = 0;
                    types[value.type]++;
                    this.collection[db.strInt(value.identity)] = value;
                }
            }
        });

        this.setState({
            labels: labels,
            types: types
        });

        this.orb.data.setup({ nodes, edges });
        this.orb.view.render(() => {
            this.orb.view.recenter();
        });
    };

    render() {
        return (
            <div className="graph-container is-flex" ref={this.graphContainer}>
                <div className={"graph " + (this.state.sidebarVisible ? "sidebar-visible" : "")} ref={this.graphElement}>
                    {/* canvas will be inserted here */}
                    <div className="sidebar-switch-btn">
                        <Button
                            icon={"fa-solid " + ((this.state.sidebarVisible === 1 || this.state.sidebarVisible === 3) ? "fa-chevron-right" : "fa-chevron-left")}
                            color="ml-auto is-small"
                            onClick={() => {
                                if (this.state.sidebarVisible <= 1) {
                                    this.setState({
                                        sidebarVisible: this.state.sidebarVisible === 1 ? 3 : 2
                                    });
                                }
                            }}
                        />
                    </div>
                </div>

                {this.state.sidebarVisible > 0 && (
                    <div className={"sidebar px-2 py-3 "
                        + (this.state.sidebarVisible === 3 ? "animate_out" : "")
                        + (this.state.sidebarVisible === 2 ? "animate_in" : "")
                        } onAnimationEnd={() => {
                            this.setState({
                                sidebarVisible: this.state.sidebarVisible === 3 ? 0 : 1
                            });
                            setTimeout(() => this.orb.view.recenter(), 100);
                    }}>
                        <div className="header has-text-weight-bold mr-6 mb-3">{
                            this.state.detail === null ? "Overview" : (this.state.detail instanceof _Node ? "Node" : "Relationship")
                        }</div>
                        <div className="content">
                            <SidebarContent
                                detail={this.state.detail}
                                labels={this.state.labels}
                                types={this.state.types} />
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
                                        color={"tag is-link is-rounded px-2 "}
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
