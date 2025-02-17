import { INodeStyle, NodeShapeType } from '@memgraph/orb';
import { useEffect, useState } from 'react';
import Modal from '../../../components/Modal';
import { Button } from '../../../components/form';
import hexagon_icon from '../../../assets/hexagon_icon.png';

interface IEdgeStyleModalProps {
    label: string;
    currentSettings: INodeStyle;
    handleClose: () => void;
    handleStyleSet: (label: string, property: string, value: string | number | NodeShapeType) => void;
    labelFields: string[]; //list of available options for visible label
}

const NodeStyleModal: React.FC<IEdgeStyleModalProps> = ({
    label,
    currentSettings,
    handleClose,
    handleStyleSet,
    labelFields,
}) => {
    const [defaultColor, setDefaultColor] = useState<{ [label: string]: string }>({});

    useEffect(() => {
        if (!(label in defaultColor)) {
            setDefaultColor(prev => ({ ...prev, [label]: currentSettings.color as string }));
        }
    }, [label, currentSettings.color, defaultColor]);

    return (
        <Modal
            title={'Set style of label :' + label}
            backdrop={true}
            handleClose={handleClose}
            buttons={
                <>
                    <Button text='Close' icon='fa-solid fa-xmark' onClick={handleClose} />
                    <Button
                        text='Default values'
                        icon='fa-solid fa-rotate-right'
                        onClick={() => {
                            handleStyleSet(label, 'color', defaultColor[label]);
                            handleStyleSet(label, 'size', 5);
                            handleStyleSet(label, 'fontSize', 4);
                            handleStyleSet(label, 'shape', NodeShapeType.CIRCLE);
                            handleStyleSet(label, 'label', '#label');
                        }}
                        color='is-warning'
                    />
                </>
            }
        >
            <div className='field'>
                <label className='label'>Color:</label>
                <div className='control buttons'>
                    <input
                        type='color'
                        value={currentSettings.color as string}
                        className='input'
                        onChange={e => handleStyleSet(label, 'color', e.currentTarget.value)}
                    />
                </div>
            </div>
            <div className='field'>
                <label className='label'>Size:</label>
                <div className='control'>
                    <input
                        className='slider is-fullwidth'
                        type='range'
                        min='1'
                        max='10'
                        step='1'
                        value={currentSettings.size ?? 5}
                        onChange={e => handleStyleSet(label, 'size', e.currentTarget.valueAsNumber)}
                    />
                </div>
            </div>
            <div className='field'>
                <label className='label'>Font size:</label>
                <div className='control'>
                    <input
                        className='slider is-fullwidth'
                        type='range'
                        min='0'
                        max='10'
                        step='1'
                        value={currentSettings.fontSize ?? 4}
                        onChange={e => handleStyleSet(label, 'fontSize', e.currentTarget.valueAsNumber)}
                    />
                </div>
            </div>
            <div className='field'>
                <label className='label'>Shape:</label>
                <div className='control buttons has-addons'>
                    <Button
                        key='circle'
                        icon='fa-solid fa-circle'
                        color={
                            typeof currentSettings.shape === 'undefined' ||
                            currentSettings.shape === NodeShapeType.CIRCLE
                                ? 'is-active'
                                : ''
                        }
                        onClick={() => handleStyleSet(label, 'shape', NodeShapeType.CIRCLE)}
                    />
                    <Button
                        key='square'
                        icon='fa-solid fa-square'
                        color={currentSettings.shape === NodeShapeType.SQUARE ? 'is-active' : ''}
                        onClick={() => handleStyleSet(label, 'shape', NodeShapeType.SQUARE)}
                    />
                    <Button
                        key='diamond'
                        icon='fa-solid fa-diamond'
                        color={currentSettings.shape === NodeShapeType.DIAMOND ? 'is-active' : ''}
                        onClick={() => handleStyleSet(label, 'shape', NodeShapeType.DIAMOND)}
                    />
                    <Button
                        key='triangle_up'
                        color={currentSettings.shape === NodeShapeType.TRIANGLE ? 'is-active' : ''}
                        onClick={() => handleStyleSet(label, 'shape', NodeShapeType.TRIANGLE)}
                    >
                        <span className='icon r-270'>
                            <i className='fa-solid fa-play' />
                        </span>
                    </Button>
                    <Button
                        key='triangle_down'
                        color={currentSettings.shape === NodeShapeType.TRIANGLE_DOWN ? 'is-active' : ''}
                        onClick={() => handleStyleSet(label, 'shape', NodeShapeType.TRIANGLE_DOWN)}
                    >
                        <span className='icon r-90'>
                            <i className='fa-solid fa-play' />
                        </span>
                    </Button>
                    <Button
                        key='star'
                        icon='fa-solid fa-star'
                        color={currentSettings.shape === NodeShapeType.STAR ? 'is-active' : ''}
                        onClick={() => handleStyleSet(label, 'shape', NodeShapeType.STAR)}
                    />
                    <Button
                        key='hexagon'
                        color={currentSettings.shape === NodeShapeType.HEXAGON ? 'is-active' : ''}
                        onClick={() => handleStyleSet(label, 'shape', NodeShapeType.HEXAGON)}
                    >
                        <span className='icon'>
                            <img src={hexagon_icon} alt='hexagon' />
                        </span>
                    </Button>
                </div>
            </div>
            <div className='field'>
                <label className='label'>Label field:</label>
                <div className='control buttons has-addons'>
                    <Button
                        text='<id>'
                        key='#id'
                        color={currentSettings.label === '#id' ? 'is-active' : ''}
                        onClick={() => handleStyleSet(label, 'label', '#id')}
                    />
                    <Button
                        text='<label>'
                        key='#label'
                        color={
                            typeof currentSettings.label === 'undefined' || currentSettings.label === '#label'
                                ? 'is-active'
                                : ''
                        }
                        onClick={() => handleStyleSet(label, 'label', '#label')}
                    />
                    {labelFields.length > 0 &&
                        labelFields.map(labelField => (
                            <Button
                                key={labelField}
                                text={labelField}
                                color={currentSettings.label === labelField ? 'is-active' : ''}
                                onClick={() => handleStyleSet(label, 'label', labelField)}
                            />
                        ))}
                </div>
            </div>
        </Modal>
    );
};

export default NodeStyleModal;
