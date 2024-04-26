import * as React from "react";
import { IEdgeBase, IEdgeStyle, INodeBase, INodeStyle, NodeShapeType, Orb, OrbEventType } from "@memgraph/orb";
import db from "../../db";
import { Node as _Node, Record, Relationship as _Relationship } from "neo4j-driver";
import { Button } from "../../components/form";
import orb_logo from "../../assets/orb_logo.png";
import hexagon_icon from "../../assets/hexagon_icon.png";
import { ITabManager } from "../../utils/interfaces";
import { settings } from "../../layout/Settings";
import Modal from "../../components/Modal";

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
    labelModal: string|null;
    typeModal: string|null;
    orbSettings: IOrbSettings;
}

class Graph extends React.Component<IGraphProps, IGraphState> {
    state: IGraphState = {
        sidebarVisible: 1,
        labels: {},
        types: {},
        detail: null,
        labelModal: null,
        typeModal: null,
        orbSettings: Object.assign(
            sessionStorage.getItem("orbSettings") ? JSON.parse(sessionStorage.getItem("orbSettings")) : {},
            { labelStyles: {} }
        )
    };

    graphContainer = React.createRef<HTMLDivElement>();
    graphElement = React.createRef<HTMLDivElement>();
    orb: Orb;

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
        const tmpOrbSettings: IOrbSettings = Object.assign({}, this.state.orbSettings);
        Object.keys(tmpOrbSettings.labelStyles).forEach(label => {
            if (!(label in labels))
                delete tmpOrbSettings[label];
        });
        //define missing styles for labels
        Object.keys(labels).forEach((label, i) => {
            if (!(label in tmpOrbSettings.labelStyles)) {
                tmpOrbSettings.labelStyles[label] = {
                    color: COLORS[i],
                    shape: NodeShapeType.CIRCLE
                };
            }
        });
        //apply label styles
        this.orb.data.getNodes().forEach(node => {
            node.style.color = tmpOrbSettings.labelStyles[node.data.element.labels[0]].color;
        });

        this.setState({
            orbSettings: tmpOrbSettings
        });
        sessionStorage.setItem('orbSettings', JSON.stringify(tmpOrbSettings))

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

    fullscreenSwitchBtn = () => {
        if (document.fullscreenElement === null) {
            this.graphContainer.current.requestFullscreen().then(() => {
                setTimeout(() => this.orb.view.recenter(), 100);
            });
        } else {
            document.exitFullscreen().then(() => {
                setTimeout(() => this.orb.view.recenter(), 100);
            });
        }
    }

    updateOrbSettingsLabelStyle = (label: string, property: string, value: any) => {
        this.setState(state => {
            return {
                orbSettings: Object.assign(state.orbSettings, {
                    labelStyles: {
                        [label]: {
                            [property]: value
                        }
                    }
                })
            };
        });
        this.orb.data.getNodes().forEach(node => {
            if (node.data.element.labels[0] === label)
                node.style[property] = value;
            this.orb.view.render();
        });
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
                                labelClick={(label: string) => this.setState({ labelModal: label })}
                                orbSettings={this.state.orbSettings} />
                        </div>
                    </div>
                )}

                <div className="buttons">
                    {document.fullscreenEnabled && (
                        <Button
                            icon={"fa-solid " + (document.fullscreenElement === null ? "fa-expand" : "fa-compress")}
                            color="mr-0"
                            onClick={this.fullscreenSwitchBtn}
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

                {this.state.labelModal && <LabelModal
                    label={this.state.labelModal}
                    currentSettings={this.state.orbSettings.labelStyles[this.state.labelModal]}
                    handleClose={() => this.setState({labelModal: null})}
                    handleColor={(label: string, color: string) => this.updateOrbSettingsLabelStyle(label, 'color', color)}
                    handleSize={(label: string, size: number) => this.updateOrbSettingsLabelStyle(label, 'size', size)}
                    handleFontSize={(label: string, size: number) => this.updateOrbSettingsLabelStyle(label, 'fontSize', size)}
                    handleShape={(label: string, shape: NodeShapeType) => this.updateOrbSettingsLabelStyle(label, 'shape', shape)}
                />}
            </div>
        );
    }
}

interface ISidebarProps {
    detail: _Node | _Relationship | null;
    labels: { [key: string]: number };
    types: { [key: string]: number };
    labelClick: (label: string) => void;
    orbSettings: IOrbSettings;
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
                                            + (label in this.props.orbSettings.labelStyles
                                                ? COLORS.indexOf(this.props.orbSettings.labelStyles[label].color as string)
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

interface ILabelModalProps {
    label: string;
    currentSettings: INodeStyle;
    handleClose: () => void;
    handleColor: (label: string, color: string) => void;
    handleSize: (label: string, size: number) => void;
    handleFontSize: (label: string, size: number) => void;
    handleShape: (label: string, shape: NodeShapeType) => void;
}

class LabelModal extends React.Component<ILabelModalProps, {}> {
    render() {
        return (
            <Modal
                title={"Set style of label :" + this.props.label}
                backdrop={true}
                handleClose={this.props.handleClose}>
                <div className="field">
                    <label className="label">Color:</label>
                    <div className="control buttons">
                        {COLORS.map((color, i) => <Button
                            color={"is-small c" + i + (this.props.currentSettings.color === color ? ' is-focused' : '')}
                            text="&nbsp;"
                            onClick={() => this.props.handleColor(this.props.label, color)} />)}
                    </div>
                </div>
                <div className="field">
                    <label className="label">Size:</label>
                    <div className="control">
                        <input className="slider is-fullwidth" type="range" min="1" max="10" step="1" value={this.props.currentSettings.size ?? 5}
                               onChange={(e) => this.props.handleSize(this.props.label, e.currentTarget.valueAsNumber)} />
                    </div>
                </div>
                <div className="field">
                    <label className="label">Font size:</label>
                    <div className="control">
                        <input className="slider is-fullwidth" type="range" min="0" max="10" step="1" value={this.props.currentSettings.fontSize ?? 4}
                               onChange={(e) => this.props.handleFontSize(this.props.label, e.currentTarget.valueAsNumber)} />
                    </div>
                </div>
                <div className="field">
                    <label className="label">Shape:</label>
                    <div className="control buttons has-addons">
                        <Button icon="fa-solid fa-circle" color={this.props.currentSettings.shape === NodeShapeType.CIRCLE ? 'is-active' : ''} onClick={() => this.props.handleShape(this.props.label, NodeShapeType.CIRCLE)} />
                        <Button icon="fa-solid fa-square" color={this.props.currentSettings.shape === NodeShapeType.SQUARE ? 'is-active' : ''} onClick={() => this.props.handleShape(this.props.label, NodeShapeType.SQUARE)} />
                        <Button icon="fa-solid fa-diamond" color={this.props.currentSettings.shape === NodeShapeType.DIAMOND ? 'is-active' : ''} onClick={() => this.props.handleShape(this.props.label, NodeShapeType.DIAMOND)} />
                        <Button color={this.props.currentSettings.shape === NodeShapeType.TRIANGLE ? 'is-active' : ''} onClick={() => this.props.handleShape(this.props.label, NodeShapeType.TRIANGLE)}>
                            <span className="icon r-270">
                                <i className="fa-solid fa-play" />
                            </span>
                        </Button>
                        <Button color={this.props.currentSettings.shape === NodeShapeType.TRIANGLE_DOWN ? 'is-active' : ''} onClick={() => this.props.handleShape(this.props.label, NodeShapeType.TRIANGLE_DOWN)}>
                            <span className="icon r-90">
                                <i className="fa-solid fa-play" />
                            </span>
                        </Button>
                        <Button icon="fa-solid fa-star" color={this.props.currentSettings.shape === NodeShapeType.STAR ? 'is-active' : ''} onClick={() => this.props.handleShape(this.props.label, NodeShapeType.STAR)} />
                        <Button color={this.props.currentSettings.shape === NodeShapeType.HEXAGON ? 'is-active' : ''} onClick={() => this.props.handleShape(this.props.label, NodeShapeType.HEXAGON)}>
                            <span className="icon">
                            <img src={hexagon_icon} alt="hexagon" />
                                </span>
                        </Button>
                    </div>
                </div>
            </Modal>
        );
    }
}

export default Graph;
