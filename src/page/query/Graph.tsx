import * as React from "react";
import { Orb, OrbEventType } from "@memgraph/orb";
import { EPage } from "../../utils/enums";
import db from "../../db";
import { Node as _Node, Record, Relationship as _Relationship } from "neo4j-driver";
import { Button } from "../../components/form";
import orb_logo from "../../assets/orb_logo.png";
import { ITabManager } from "../../utils/interfaces";

interface MyNode {
    id: string;
    label: string;
    identity: number | string;
}

interface MyEdge {
    id: string;
    label: string;
    start: any;
    end: any;
    identity: number | string;
}

interface IGraphProps {
    rows: Record[];
    tabManager: ITabManager
}

class Graph extends React.Component<IGraphProps, {}> {
    graphElement = React.createRef<HTMLDivElement>();
    orb: Orb;

    componentDidMount() {
        this.initGraphView();
    }

    initGraphView = () => {
        const current = this.graphElement.current;
        if (!current) return;

        if (!this.orb) {
            this.orb = new Orb<MyNode, MyEdge>(current);

            this.orb.events.on(OrbEventType.NODE_CLICK, event => {
                this.props.tabManager.add({ prefix: "Node", i: event.node.id }, "fa-solid fa-pen-to-square", EPage.Node, {
                    id: event.node.data.identity,
                    database: db.database,
                });
            });

            this.orb.events.on(OrbEventType.EDGE_CLICK, event => {
                this.props.tabManager.add({ prefix: "Rel", i: event.edge.id }, "fa-regular fa-pen-to-square", EPage.Rel, {
                    id: event.edge.data.identity,
                    database: db.database,
                });
            });
        }

        let nodes: MyNode[] = [];
        let edges: MyEdge[] = [];
        this.props.rows.forEach(row => {
            for (let key of row.keys) {
                const value = row.get(key);
                if (value instanceof _Node) nodes.push({ id: db.strInt(value.identity), label: ":" + value.labels.join(":"), identity: db.getId(value) });
                else if (value instanceof _Relationship)
                    edges.push({
                        id: db.strInt(value.identity),
                        start: db.strInt(value.start),
                        end: db.strInt(value.end),
                        label: ":" + value.type,
                        identity: db.getId(value),
                    });
            }
        });

        this.orb.data.setup({ nodes, edges });
        this.orb.view.render(() => {
            this.orb.view.recenter();
        });
    };

    render() {
        return (
            <div className="graph" ref={this.graphElement}>
                <div className="buttons">
                    {document.fullscreenEnabled && (
                        <Button
                            icon={"fa-solid " + (document.fullscreenElement === null ? "fa-expand" : "fa-compress")}
                            color="mr-0"
                            onClick={() => {
                                if (document.fullscreenElement === null) {
                                    this.graphElement.current.requestFullscreen().then(() => {
                                        setTimeout(() => this.orb.view.recenter(), 100);
                                        this.setState({});
                                    });
                                } else {
                                    document.exitFullscreen().then(() => {
                                        setTimeout(() => this.orb.view.recenter(), 100);
                                        this.setState({});
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

export default Graph;
