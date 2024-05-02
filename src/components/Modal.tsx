import * as React from 'react';
import { Button, Checkbox } from './form';
import { ClipboardContext } from '../utils/contexts';
import { toJSON } from '../utils/fn';

export default class Modal extends React.Component<{
    title: string;
    color?: string;
    handleClose: () => void;
    children?: React.ReactNode;
    icon?: string;
    backdrop?: boolean;
    buttons?: React.ReactNode;
}> {
    render() {
        return (
            <div className='modal is-active'>
                <div
                    className='modal-background'
                    onClick={this.props.backdrop && this.props.handleClose}
                ></div>
                <div className='modal-card'>
                    <header
                        className={
                            'modal-card-head ' + (this.props.color || 'is-dark')
                        }
                    >
                        <p className='modal-card-title'>
                            {this.props.icon && (
                                <span className='icon mr-3'>
                                    <i className={this.props.icon} />
                                </span>
                            )}
                            {this.props.title}
                        </p>
                        <button
                            className='delete'
                            aria-label='close'
                            onClick={this.props.handleClose}
                        />
                    </header>
                    {this.props.children && (
                        <section className='modal-card-body'>
                            {this.props.children}
                        </section>
                    )}
                    {this.props.buttons && (
                        <footer className='modal-card-foot is-justify-content-flex-end buttons'>
                            {this.props.buttons}
                        </footer>
                    )}
                </div>
            </div>
        );
    }
}

export class CloseConfirmModal extends React.Component<
    {
        handleConfirm: () => void;
        handleClose: () => void;
    },
    null
> {
    render() {
        return (
            <Modal
                title='Are you sure?'
                color='is-warning'
                handleClose={this.props.handleClose}
                icon='fa-solid fa-circle-exclamation'
                buttons={
                    <>
                        <Button
                            text='Close anyway'
                            icon='fa-solid fa-check'
                            onClick={this.props.handleConfirm}
                            color='is-warning'
                        />
                        <Button
                            text="Don't close"
                            icon='fa-solid fa-xmark'
                            onClick={this.props.handleClose}
                        />
                    </>
                }
            >
                <p>
                    You have unsaved changes. By closing this tab you will lose
                    them.
                </p>
                <p className='mt-5'>
                    <i className='fa-solid fa-info'></i>
                    <i className='ml-2'>
                        You can disable this confirmation dialog in settings.
                    </i>
                </p>
            </Modal>
        );
    }
}

export class DeleteModal extends React.Component<
    {
        delete: number | string;
        detach?: boolean;
        handleConfirm: (id: number | string, detach: boolean) => void;
        handleClose: () => void;
    },
    { detach: boolean }
> {
    state: { detach: boolean } = {
        detach: false,
    };

    handleConfirm = () => {
        this.props.handleConfirm(this.props.delete, this.state.detach);
        this.props.handleClose();
    };

    render() {
        return (
            <Modal
                title='Are you sure?'
                color='is-danger'
                handleClose={this.props.handleClose}
                icon='fa-solid fa-circle-exclamation'
                buttons={
                    <>
                        <Button
                            text='Confirm'
                            icon='fa-solid fa-check'
                            onClick={this.handleConfirm}
                            color='is-danger'
                        />
                        <Button
                            text='Cancel'
                            icon='fa-solid fa-xmark'
                            onClick={this.props.handleClose}
                        />
                    </>
                }
            >
                {this.props.detach && (
                    <div className='mb-3'>
                        <Checkbox
                            name='detachDelete'
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                            ) =>
                                this.setState({
                                    detach: e.currentTarget.checked,
                                })
                            }
                            label='Detach delete?'
                            checked={this.state.detach}
                            color='is-danger'
                        />
                    </div>
                )}
            </Modal>
        );
    }
}

export class PropertiesModal extends React.Component<
    { properties: object; handleClose: () => void },
    {}
> {
    render() {
        return (
            <Modal
                title='Properties'
                handleClose={this.props.handleClose}
                icon='fa-solid fa-rectangle-list'
                backdrop={true}
            >
                <div className='control has-icons-right'>
                    <pre>{toJSON(this.props.properties)}</pre>
                    <ClipboardContext.Consumer>
                        {copy => (
                            <span
                                className='icon is-right is-clickable'
                                onClick={copy}
                            >
                                <i className='fa-regular fa-copy' />
                            </span>
                        )}
                    </ClipboardContext.Consumer>
                </div>
            </Modal>
        );
    }
}
