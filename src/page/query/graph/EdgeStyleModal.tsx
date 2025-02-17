import { IEdgeStyle } from '@memgraph/orb';
import Modal from '../../../components/Modal';
import { Button } from '../../../components/form';

interface IEdgeStyleModalProps {
    type: string;
    currentSettings: IEdgeStyle;
    handleClose: () => void;
    handleStyleSet: (type: string, property: string, value: string | number) => void;
    labelFields: string[]; //list of available options for visible label
}

const EdgeStyleModal: React.FC<IEdgeStyleModalProps> = ({
    type,
    currentSettings,
    handleClose,
    handleStyleSet,
    labelFields,
}) => {
    return (
        <Modal
            title={'Set style of type :' + type}
            backdrop={true}
            handleClose={handleClose}
            buttons={
                <>
                    <Button text='Close' icon='fa-solid fa-xmark' onClick={handleClose} />
                    <Button
                        text='Default values'
                        icon='fa-solid fa-rotate-right'
                        onClick={() => {
                            handleStyleSet(type, 'color', '#ababab');
                            handleStyleSet(type, 'width', 0.3);
                            handleStyleSet(type, 'fontSize', 4);
                            handleStyleSet(type, 'label', '#label');
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
                        onChange={e => handleStyleSet(type, 'color', e.currentTarget.value)}
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
                        value={currentSettings.width ?? 0.3}
                        onChange={e => handleStyleSet(type, 'width', e.currentTarget.valueAsNumber)}
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
                        onChange={e => handleStyleSet(type, 'fontSize', e.currentTarget.valueAsNumber)}
                    />
                </div>
            </div>

            <div className='field'>
                <label className='label'>Label field:</label>
                <div className='control buttons has-addons'>
                    <Button
                        text='<id>'
                        key='#id'
                        color={currentSettings.label === '#id' ? 'is-active' : ''}
                        onClick={() => handleStyleSet(type, 'label', '#id')}
                    />
                    <Button
                        text='<label>'
                        key='#label'
                        color={
                            typeof currentSettings.label === 'undefined' || currentSettings.label === '#label'
                                ? 'is-active'
                                : ''
                        }
                        onClick={() => handleStyleSet(type, 'label', '#label')}
                    />
                    {labelFields.length > 0 &&
                        labelFields.map(label => (
                            <Button
                                key={label}
                                text={label}
                                color={currentSettings.label === label ? 'is-active' : ''}
                                onClick={() => handleStyleSet(type, 'label', label)}
                            />
                        ))}
                </div>
            </div>
        </Modal>
    );
};

export default EdgeStyleModal;
