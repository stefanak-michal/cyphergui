import { useState } from 'react';
import { Button, Checkbox } from './form';
import { ClipboardContext } from '../utils/contexts';
import { toJSON } from '../utils/fn';

const Modal: React.FC<{
    title: string;
    color?: string;
    handleClose: () => void;
    children?: React.ReactNode;
    icon?: string;
    backdrop?: boolean;
    buttons?: React.ReactNode;
}> = ({ title, color, handleClose, children, icon, backdrop, buttons }) => {
    return (
        <div className='modal is-active'>
            <div className='modal-background' onClick={backdrop && handleClose}></div>
            <div className='modal-card'>
                <header className={'modal-card-head ' + (color || 'is-dark')}>
                    <p className='modal-card-title'>
                        {icon && (
                            <span className='icon mr-3'>
                                <i className={icon} />
                            </span>
                        )}
                        {title}
                    </p>
                    <button className='delete' aria-label='close' onClick={handleClose} />
                </header>
                {children && <section className='modal-card-body'>{children}</section>}
                {buttons && <footer className='modal-card-foot is-justify-content-flex-end buttons'>{buttons}</footer>}
            </div>
        </div>
    );
};

export default Modal;

export const CloseConfirmModal: React.FC<{
    handleConfirm: () => void;
    handleClose: () => void;
}> = ({ handleConfirm, handleClose }) => {
    return (
        <Modal
            title='Are you sure?'
            color='is-warning'
            handleClose={handleClose}
            icon='fa-solid fa-circle-exclamation'
            buttons={
                <>
                    <Button text='Close anyway' icon='fa-solid fa-check' onClick={handleConfirm} color='is-warning' />
                    <Button text="Don't close" icon='fa-solid fa-xmark' onClick={handleClose} />
                </>
            }
        >
            <p>You have unsaved changes. By closing this tab you will lose them.</p>
            <p className='mt-5'>
                <i className='fa-solid fa-info'></i>
                <i className='ml-2'>You can disable this confirmation dialog in settings.</i>
            </p>
        </Modal>
    );
};

export const DeleteModal: React.FC<{
    delete: number | string;
    detach?: boolean;
    handleConfirm: (id: number | string, detach: boolean) => void;
    handleClose: () => void;
}> = ({ delete: deleteId, detach, handleConfirm, handleClose }) => {
    const [isDetached, setIsDetached] = useState(false);

    const onConfirm = () => {
        handleConfirm(deleteId, isDetached);
        handleClose();
    };

    return (
        <Modal
            title='Are you sure?'
            color='is-danger'
            handleClose={handleClose}
            icon='fa-solid fa-circle-exclamation'
            buttons={
                <>
                    <Button text='Confirm' icon='fa-solid fa-check' onClick={onConfirm} color='is-danger' />
                    <Button text='Cancel' icon='fa-solid fa-xmark' onClick={handleClose} />
                </>
            }
        >
            {detach && (
                <div className='mb-3'>
                    <Checkbox
                        name='detachDelete'
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsDetached(e.currentTarget.checked)}
                        label='Detach delete?'
                        checked={isDetached}
                        color='is-danger'
                    />
                </div>
            )}
        </Modal>
    );
};

export const PropertiesModal: React.FC<{ properties: object; handleClose: () => void }> = ({
    properties,
    handleClose,
}) => {
    return (
        <Modal title='Properties' handleClose={handleClose} icon='fa-solid fa-rectangle-list' backdrop={true}>
            <div className='control has-icons-right'>
                <pre>{toJSON(properties)}</pre>
                <ClipboardContext.Consumer>
                    {copy => (
                        <span className='icon is-right is-clickable' onClick={copy}>
                            <i className='fa-regular fa-copy' />
                        </span>
                    )}
                </ClipboardContext.Consumer>
            </div>
        </Modal>
    );
};
