import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { IEdgeBase, IEdgeStyle, INodeBase, INodeStyle, NodeShapeType, Orb, OrbEventType, Color } from '@memgraph/orb';
import db from '../../db';
import { Node as _Node, Record, Relationship as _Relationship } from 'neo4j-driver-lite';
import { Button } from '../../components/form';
import orb_logo from '../../assets/orb_logo.png';
import { IStashManager, ITabManager } from '../../utils/interfaces';
import { settings } from '../../layout/Settings';
import NodeStyleModal from './graph/NodeStyleModal';
import SidebarContent from './graph/SidebarContent';
import EdgeStyleModal from './graph/EdgeStyleModal';

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

interface IStyle {
    [label: string]: { [key: string]: any };
}

interface IGraphProps {
    rows: Record[];
    tabManager: ITabManager;
    stashManager: IStashManager;
    database: string;
}

const Graph: React.FC<IGraphProps> = ({ rows, tabManager, stashManager, database }) => {
    const [sidebarVisible, setSidebarVisible] = useState(1); // 1 - visible, 0 - hidden, 2 - animate in, 3 - animate out
    const [labels, setLabels] = useState<{ [key: string]: number }>({}); // label: amount of nodes with it
    const [types, setTypes] = useState<{ [key: string]: number }>({}); // type: amount of rels with it
    const [detail, setDetail] = useState<_Node | _Relationship | null>(null); // clicked node/rel to see details in sidebar
    const [detailHover, setDetailHover] = useState<_Node | _Relationship | null>(null); // hovered node to see details in sidebar
    const [nodeStyleModal, setNodeStyleModal] = useState<string | null>(null);
    const [edgeStyleModal, setEdgeStyleModal] = useState<string | null>(null);
    const [nodeStyles, setNodeStyles] = useState<IStyle>(
        sessionStorage.getItem('nodeStyles') ? JSON.parse(sessionStorage.getItem('nodeStyles')) : {}
    );
    const [edgeStyles, setEdgeStyles] = useState<IStyle>(
        sessionStorage.getItem('edgeStyles') ? JSON.parse(sessionStorage.getItem('edgeStyles')) : {}
    );

    const graphContainer = useRef<HTMLDivElement>(null);
    const graphElement = useRef<HTMLDivElement>(null);
    const orb = useRef<Orb<MyNode, MyEdge>>(null);

    useEffect(() => {
        const rootElement = document.getElementById('root');
        rootElement?.addEventListener('input', listenForDarkMode);
        return () => {
            rootElement?.removeEventListener('input', listenForDarkMode);
        };
    }, []);

    useLayoutEffect(() => {
        initGraphView();
    }, []);

    const initGraphView = () => {
        initializeOrb();
        if (!orb.current) return;

        const nodes: MyNode[] = [];
        const edges: MyEdge[] = [];
        const labels: { [key: string]: number } = {};
        const types: { [key: string]: number } = {};
        rows.forEach(row => {
            for (const key of row.keys) {
                const value = row.get(key);
                if (value instanceof _Node && !nodes.find(n => n.id === db.strInt(value.identity))) {
                    //prepare data for orb
                    nodes.push({
                        id: db.strInt(value.identity),
                        label: ':' + value.labels.join(':'),
                        element: value,
                    });
                    //collect labels with counts
                    if (!(value.labels[0] in labels)) labels[value.labels[0]] = 0;
                    labels[value.labels[0]]++;
                } else if (value instanceof _Relationship && !edges.find(e => e.id === db.strInt(value.identity))) {
                    //prepare data for orb
                    edges.push({
                        id: db.strInt(value.identity),
                        start: db.strInt(value.start),
                        end: db.strInt(value.end),
                        label: ':' + value.type,
                        element: value,
                    });
                    //collect type with count
                    if (!(value.type in types)) types[value.type] = 0;
                    types[value.type]++;
                }
            }
        });

        setLabels(labels);
        setTypes(types);

        orb.current.data.setup({ nodes, edges });
        applyNodeStyles(Object.keys(labels));
        applyEdgeStyles(Object.keys(types));

        orb.current.view.setSettings({
            render: {
                shadowIsEnabled: false,
                shadowOnEventIsEnabled: true,
                contextAlphaOnEvent: 0.5,
            },
        });
        orb.current.view.render(() => {
            orb.current.view.recenter();
        });
    };

    const initializeOrb = () => {
        if (!orb.current && graphElement.current) {
            orb.current = new Orb<MyNode, MyEdge>(graphElement.current);
            orb.current.data.setDefaultStyle({
                getNodeStyle(node): INodeStyle {
                    return {
                        size: 5,
                        color: '#1d87c9',
                        fontSize: 4,
                        fontColor: settings().darkMode ? 'white' : 'black',
                        shape: NodeShapeType.CIRCLE,
                        fontFamily: 'Inter, Helvetica, Arial, sans-serif',
                        label: node.data.label,
                        shadowSize: 2,
                        shadowColor: '#8c8c8c',
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
                        shadowSize: 2,
                        shadowColor: '#8c8c8c',
                    };
                },
            });

            orb.current.events.on(OrbEventType.MOUSE_CLICK, event => {
                setDetail(typeof event.subject === 'undefined' ? null : event.subject.data.element);
            });
            orb.current.events.on(OrbEventType.MOUSE_MOVE, event => {
                setDetailHover(typeof event.subject === 'undefined' ? null : event.subject.data.element);
            });
        }
    };

    const applyNodeStyles = (labels: string[]) => {
        if (!orb.current) return;

        const tmpNodeStyles = { ...nodeStyles };
        //remove unused styles
        Object.keys(tmpNodeStyles).forEach(label => {
            if (!labels.includes(label)) delete tmpNodeStyles[label];
        });
        //define missing styles for labels
        labels.forEach(label => {
            if (!(label in tmpNodeStyles)) {
                tmpNodeStyles[label] = {
                    color: Color.getRandomColor().toString(),
                };
            } else if (!('color' in tmpNodeStyles[label])) {
                tmpNodeStyles[label].color = Color.getRandomColor().toString();
            }
        });

        //apply label styles
        orb.current.data.getNodes().forEach(node => {
            node.style.color = tmpNodeStyles[node.data.element.labels[0]].color;
            if ('shape' in tmpNodeStyles[node.data.element.labels[0]])
                node.style.shape = tmpNodeStyles[node.data.element.labels[0]].shape;
            if ('size' in tmpNodeStyles[node.data.element.labels[0]])
                node.style.size = tmpNodeStyles[node.data.element.labels[0]].size;
            if ('fontSize' in tmpNodeStyles[node.data.element.labels[0]])
                node.style.fontSize = tmpNodeStyles[node.data.element.labels[0]].fontSize;
            if ('label' in tmpNodeStyles[node.data.element.labels[0]]) {
                if (tmpNodeStyles[node.data.element.labels[0]].label in node.data.element.properties)
                    node.style.label = node.data.element.properties[tmpNodeStyles[node.data.element.labels[0]].label];
                else if (tmpNodeStyles[node.data.element.labels[0]].label === '#id') node.style.label = node.data.id;
                else node.style.label = node.data.label;
            }
        });

        setNodeStyles(tmpNodeStyles);
        sessionStorage.setItem('nodeStyles', JSON.stringify(tmpNodeStyles));
    };

    const applyEdgeStyles = (types: string[]) => {
        if (!orb.current) return;

        const tmpEdgeStyles = { ...edgeStyles };
        //remove unused styles
        Object.keys(tmpEdgeStyles).forEach(type => {
            if (!types.includes(type)) delete tmpEdgeStyles[type];
        });
        //define missing styles for types
        types.forEach(type => {
            if (!(type in tmpEdgeStyles)) {
                tmpEdgeStyles[type] = {
                    color: '#ababab',
                };
            } else if (!('color' in tmpEdgeStyles[type])) {
                tmpEdgeStyles[type].color = '#ababab';
            }
        });

        //apply type styles
        orb.current.data.getEdges().forEach(edge => {
            edge.style.color = tmpEdgeStyles[edge.data.element.type].color;
            if ('width' in tmpEdgeStyles[edge.data.element.type])
                edge.style.width = tmpEdgeStyles[edge.data.element.type].width;
            if ('fontSize' in tmpEdgeStyles[edge.data.element.type])
                edge.style.fontSize = tmpEdgeStyles[edge.data.element.type].fontSize;
            if ('label' in tmpEdgeStyles[edge.data.element.type]) {
                if (tmpEdgeStyles[edge.data.element.type].label in edge.data.element.properties)
                    edge.style.label = edge.data.element.properties[tmpEdgeStyles[edge.data.element.type].label];
                else if (tmpEdgeStyles[edge.data.element.type].label === '#id') edge.style.label = edge.data.id;
                else edge.style.label = edge.data.label;
            }
        });

        setEdgeStyles(tmpEdgeStyles);
        sessionStorage.setItem('edgeStyles', JSON.stringify(tmpEdgeStyles));
    };

    const listenForDarkMode = (event: Event) => {
        event.preventDefault();
        if ((event.target as HTMLInputElement).matches('input[type="checkbox"][name="darkMode"]') && orb.current) {
            orb.current.data.getNodes().forEach(node => {
                node.style.fontColor = settings().darkMode ? 'white' : 'black';
            });
            orb.current.data.getEdges().forEach(edge => {
                edge.style.fontColor = settings().darkMode ? 'white' : 'black';
            });
            orb.current.view.render();
        }
    };

    const sidebarSwitchBtn = () => {
        if (sidebarVisible <= 1) {
            setSidebarVisible(sidebarVisible === 1 ? 3 : 2);
        }
    };

    const fullscreenSwitchBtn = () => {
        if (document.fullscreenElement === null) {
            graphContainer.current?.requestFullscreen().then(() => {
                setTimeout(() => orb.current?.view.recenter(), 100);
            });
        } else {
            document.exitFullscreen().then(() => {
                setTimeout(() => orb.current?.view.recenter(), 100);
            });
        }
    };

    const updateNodeStyle = (label: string, property: string, value: string | number | NodeShapeType) => {
        setNodeStyles(prevState => {
            const newState = { ...prevState };
            newState[label][property] = value;
            sessionStorage.setItem('nodeStyles', JSON.stringify(newState));
            return newState;
        });

        if (orb.current) {
            orb.current.data.getNodes().forEach(node => {
                if (node.data.element.labels[0] === label) {
                    let tmpValue = value;
                    if (property === 'label') {
                        if (value in node.data.element.properties) tmpValue = node.data.element.properties[value];
                        else if (value === '#id') tmpValue = node.data.id;
                        else tmpValue = node.data.label;
                    }
                    node.style[property] = tmpValue;
                }
            });
            orb.current.view.render();
        }
    };

    const updateEdgeStyle = (type: string, property: string, value: string | number) => {
        setEdgeStyles(prevState => {
            const newState = { ...prevState };
            newState[type][property] = value;
            sessionStorage.setItem('edgeStyles', JSON.stringify(newState));
            return newState;
        });

        if (orb.current) {
            orb.current.data.getEdges().forEach(edge => {
                if (edge.data.element.type === type) {
                    let tmpValue = value;
                    if (property === 'label') {
                        if (value in edge.data.element.properties) tmpValue = edge.data.element.properties[value];
                        else if (value === '#id') tmpValue = edge.data.id;
                        else tmpValue = edge.data.label;
                    }
                    edge.style[property] = tmpValue;
                }
            });
            orb.current.view.render();
        }
    };

    return (
        <div className='graph-container is-flex' ref={graphContainer}>
            <div className={'graph ' + (sidebarVisible > 0 ? 'sidebar-visible' : '')} ref={graphElement}>
                {/* canvas will be inserted here */}
                <div className='sidebar-switch-btn'>
                    <Button
                        icon={'fa-solid ' + (sidebarVisible % 2 === 1 ? 'fa-chevron-right' : 'fa-chevron-left')}
                        color='ml-auto is-small'
                        onClick={sidebarSwitchBtn}
                    />
                </div>
            </div>

            {sidebarVisible > 0 && (
                <div
                    className={
                        'sidebar p-3 ' +
                        (sidebarVisible === 3 ? 'animate_out' : '') +
                        (sidebarVisible === 2 ? 'animate_in' : '')
                    }
                    onAnimationEnd={() => {
                        setSidebarVisible(sidebarVisible === 3 ? 0 : 1);
                        setTimeout(() => orb.current?.view.recenter(), 100);
                    }}
                >
                    <p className='title is-4 mb-3'>
                        {(detailHover || detail) instanceof _Node
                            ? 'Node'
                            : (detailHover || detail) instanceof _Relationship
                              ? 'Relationship'
                              : 'Overview'}
                    </p>
                    <div className='content'>
                        <SidebarContent
                            detail={detailHover || detail}
                            labels={labels}
                            types={types}
                            labelClick={(label: string) => setNodeStyleModal(label)}
                            typeClick={(type: string) => setEdgeStyleModal(type)}
                            nodeStyles={nodeStyles}
                            edgeStyles={edgeStyles}
                            tabManager={tabManager}
                            stashManager={stashManager}
                            database={database}
                        />
                    </div>
                </div>
            )}

            <div className='buttons'>
                {document.fullscreenEnabled && (
                    <Button
                        icon={'fa-solid ' + (document.fullscreenElement === null ? 'fa-expand' : 'fa-compress')}
                        color='mr-0'
                        onClick={fullscreenSwitchBtn}
                        title='Fullscreen'
                    />
                )}
                <Button
                    icon='fa-solid fa-maximize'
                    onClick={() => orb.current?.view.recenter()}
                    color='mr-0'
                    title='Recenter'
                />
            </div>

            <div className='brand is-flex is-align-items-center'>
                <span className='is-size-7'>Powered by</span>
                <a href='https://github.com/memgraph/orb' target='_blank' className='ml-1'>
                    <img src={orb_logo} alt='ORB' />
                </a>
            </div>

            {nodeStyleModal && (
                <NodeStyleModal
                    label={nodeStyleModal}
                    currentSettings={nodeStyles[nodeStyleModal]}
                    handleClose={() => setNodeStyleModal(null)}
                    handleStyleSet={updateNodeStyle}
                    labelFields={
                        rows.map(record => {
                            for (const key of record.keys) {
                                const item = record.get(key);
                                if (item instanceof _Node && item.labels[0] === nodeStyleModal)
                                    return Object.keys(item.properties);
                            }
                        })[0] || []
                    }
                />
            )}

            {edgeStyleModal && (
                <EdgeStyleModal
                    type={edgeStyleModal}
                    currentSettings={edgeStyles[edgeStyleModal]}
                    handleClose={() => setEdgeStyleModal(null)}
                    handleStyleSet={updateEdgeStyle}
                    labelFields={
                        rows.map(record => {
                            for (const key of record.keys) {
                                const item = record.get(key);
                                if (item instanceof _Relationship && item.type === edgeStyleModal)
                                    return Object.keys(item.properties);
                            }
                        })[0] || []
                    }
                />
            )}
        </div>
    );
};

export default Graph;
export type { IStyle };
