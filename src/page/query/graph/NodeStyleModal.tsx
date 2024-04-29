import { INodeStyle, NodeShapeType } from "@memgraph/orb";
import * as React from "react";
import Modal from "../../../components/Modal";
import { Button } from "../../../components/form";
import hexagon_icon from "../../../assets/hexagon_icon.png";
import { COLORS } from "../Graph";

interface IEdgeStyleModalProps {
    label: string;
    i: number;
    currentSettings: INodeStyle;
    handleClose: () => void;
    handleStyleSet: (label: string, property: string, value: string|number|NodeShapeType) => void;
    labelFields: string[]; //list of available options for visible label
}

class NodeStyleModal extends React.Component<IEdgeStyleModalProps, {}> {
    render() {
        return (
            <Modal
                title={"Set style of label :" + this.props.label}
                backdrop={true}
                handleClose={this.props.handleClose}
                buttons={<>
                    <Button text="Default values" icon="fa-solid fa-rotate-right" onClick={() => {
                        this.props.handleStyleSet(this.props.label, 'color', COLORS[this.props.i]);
                        this.props.handleStyleSet(this.props.label, 'size', 5);
                        this.props.handleStyleSet(this.props.label, 'fontSize', 4);
                        this.props.handleStyleSet(this.props.label, 'shape', NodeShapeType.CIRCLE);
                        this.props.handleStyleSet(this.props.label, 'label', '#label');
                    }} color="is-info" />
                    <Button text="Close" icon="fa-solid fa-xmark" onClick={this.props.handleClose} />
                </>}>
                <div className="field">
                    <label className="label">Color:</label>
                    <div className="control buttons">
                        {COLORS.map((color, i) => <Button
                            key={'c' + i}
                            color={"is-small c" + i + (this.props.currentSettings.color === color ? ' is-focused' : '')}
                            text="&nbsp;"
                            onClick={() => this.props.handleStyleSet(this.props.label, 'color', color)} />)}
                    </div>
                </div>
                <div className="field">
                    <label className="label">Size:</label>
                    <div className="control">
                        <input className="slider is-fullwidth" type="range" min="1" max="10" step="1" value={this.props.currentSettings.size ?? 5}
                               onChange={(e) => this.props.handleStyleSet(this.props.label, 'size', e.currentTarget.valueAsNumber)} />
                    </div>
                </div>
                <div className="field">
                    <label className="label">Font size:</label>
                    <div className="control">
                        <input className="slider is-fullwidth" type="range" min="0" max="10" step="1" value={this.props.currentSettings.fontSize ?? 4}
                               onChange={(e) => this.props.handleStyleSet(this.props.label, 'fontSize', e.currentTarget.valueAsNumber)} />
                    </div>
                </div>
                <div className="field">
                    <label className="label">Shape:</label>
                    <div className="control buttons has-addons">
                        <Button key='circle' icon="fa-solid fa-circle"
                                color={(typeof this.props.currentSettings.shape === 'undefined' || this.props.currentSettings.shape === NodeShapeType.CIRCLE) ? 'is-active' : ''}
                                onClick={() => this.props.handleStyleSet(this.props.label, 'shape', NodeShapeType.CIRCLE)} />
                        <Button key='square' icon="fa-solid fa-square"
                                color={this.props.currentSettings.shape === NodeShapeType.SQUARE ? 'is-active' : ''}
                                onClick={() => this.props.handleStyleSet(this.props.label, 'shape', NodeShapeType.SQUARE)} />
                        <Button key='diamond' icon="fa-solid fa-diamond"
                                color={this.props.currentSettings.shape === NodeShapeType.DIAMOND ? 'is-active' : ''}
                                onClick={() => this.props.handleStyleSet(this.props.label, 'shape', NodeShapeType.DIAMOND)} />
                        <Button key='triangle_up'
                                color={this.props.currentSettings.shape === NodeShapeType.TRIANGLE ? 'is-active' : ''}
                                onClick={() => this.props.handleStyleSet(this.props.label, 'shape', NodeShapeType.TRIANGLE)}>
                            <span className="icon r-270">
                                <i className="fa-solid fa-play" />
                            </span>
                        </Button>
                        <Button key='triangle_down'
                                color={this.props.currentSettings.shape === NodeShapeType.TRIANGLE_DOWN ? 'is-active' : ''}
                                onClick={() => this.props.handleStyleSet(this.props.label, 'shape', NodeShapeType.TRIANGLE_DOWN)}>
                            <span className="icon r-90">
                                <i className="fa-solid fa-play" />
                            </span>
                        </Button>
                        <Button key='star' icon="fa-solid fa-star"
                                color={this.props.currentSettings.shape === NodeShapeType.STAR ? 'is-active' : ''}
                                onClick={() => this.props.handleStyleSet(this.props.label, 'shape', NodeShapeType.STAR)} />
                        <Button key='hexagon'
                                color={this.props.currentSettings.shape === NodeShapeType.HEXAGON ? 'is-active' : ''}
                                onClick={() => this.props.handleStyleSet(this.props.label, 'shape', NodeShapeType.HEXAGON)}>
                            <span className="icon">
                            <img src={hexagon_icon} alt="hexagon" />
                                </span>
                        </Button>
                    </div>
                </div>
                <div className="field">
                    <label className="label">Label field:</label>
                    <div className="control buttons has-addons">
                        <Button text="<id>" key='#id'
                                color={this.props.currentSettings.label === '#id' ? 'is-active' : ''}
                                onClick={() => this.props.handleStyleSet(this.props.label, 'label', "#id")} />
                        <Button text="<label>" key='#label'
                                color={(typeof this.props.currentSettings.label === 'undefined' || this.props.currentSettings.label === '#label') ? 'is-active' : ''}
                                onClick={() => this.props.handleStyleSet(this.props.label, 'label', "#label")} />
                        {this.props.labelFields.length > 0
                            && this.props.labelFields.map(label => <Button key={label} text={label}
                                color={this.props.currentSettings.label === label ? 'is-active' : ''}
                                onClick={() => this.props.handleStyleSet(this.props.label, 'label', label)} />)}
                    </div>
                </div>
            </Modal>
        );
    }
}

export default NodeStyleModal;
