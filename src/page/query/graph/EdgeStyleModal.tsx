import { IEdgeStyle } from '@memgraph/orb';
import * as React from 'react';
import Modal from '../../../components/Modal';
import { Button } from '../../../components/form';

interface IEdgeStyleModalProps {
    type: string;
    currentSettings: IEdgeStyle;
    handleClose: () => void;
    handleStyleSet: (type: string, property: string, value: string | number) => void;
    labelFields: string[]; //list of available options for visible label
}

class EdgeStyleModal extends React.Component<IEdgeStyleModalProps> {
    render() {
        return (
            <Modal
                title={'Set style of type :' + this.props.type}
                backdrop={true}
                handleClose={this.props.handleClose}
                buttons={
                    <>
                        <Button text='Close' icon='fa-solid fa-xmark' onClick={this.props.handleClose} />
                        <Button
                            text='Default values'
                            icon='fa-solid fa-rotate-right'
                            onClick={() => {
                                this.props.handleStyleSet(this.props.type, 'color', '#ababab');
                                this.props.handleStyleSet(this.props.type, 'width', 0.3);
                                this.props.handleStyleSet(this.props.type, 'fontSize', 4);
                                this.props.handleStyleSet(this.props.type, 'label', '#label');
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
                            value={this.props.currentSettings.color as string}
                            className='input'
                            onChange={e => this.props.handleStyleSet(this.props.type, 'color', e.currentTarget.value)}
                        />
                    </div>
                </div>
                <div className='field'>
                    <label className='label'>Width:</label>
                    <div className='control'>
                        <input
                            className='slider is-fullwidth'
                            type='range'
                            min='0'
                            max='1'
                            step='.1'
                            value={this.props.currentSettings.width ?? 0.3}
                            onChange={e =>
                                this.props.handleStyleSet(this.props.type, 'width', e.currentTarget.valueAsNumber)
                            }
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
                            value={this.props.currentSettings.fontSize ?? 4}
                            onChange={e =>
                                this.props.handleStyleSet(this.props.type, 'fontSize', e.currentTarget.valueAsNumber)
                            }
                        />
                    </div>
                </div>

                <div className='field'>
                    <label className='label'>Label field:</label>
                    <div className='control buttons has-addons'>
                        <Button
                            text='<id>'
                            key='#id'
                            color={this.props.currentSettings.label === '#id' ? 'is-active' : ''}
                            onClick={() => this.props.handleStyleSet(this.props.type, 'label', '#id')}
                        />
                        <Button
                            text='<label>'
                            key='#label'
                            color={
                                typeof this.props.currentSettings.label === 'undefined' ||
                                this.props.currentSettings.label === '#label'
                                    ? 'is-active'
                                    : ''
                            }
                            onClick={() => this.props.handleStyleSet(this.props.type, 'label', '#label')}
                        />
                        {this.props.labelFields.length > 0 &&
                            this.props.labelFields.map(label => (
                                <Button
                                    key={label}
                                    text={label}
                                    color={this.props.currentSettings.label === label ? 'is-active' : ''}
                                    onClick={() => this.props.handleStyleSet(this.props.type, 'label', label)}
                                />
                            ))}
                    </div>
                </div>
            </Modal>
        );
    }
}

export default EdgeStyleModal;
