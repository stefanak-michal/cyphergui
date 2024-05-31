import * as React from 'react';
import { ITabManager } from '../utils/interfaces';

interface ITabProps {
    id: string;
    active: boolean;
    icon?: string;
    title: string;
    tabManager: ITabManager;
}

/**
 * Tab header
 */
class Tab extends React.Component<ITabProps> {
    state = {
        delete: false,
    };

    showDelete = (e: React.MouseEvent) => {
        this.setState({ delete: e.type === 'mouseenter' });
    };

    render() {
        return (
            <li
                className={this.props.active ? 'is-active' : ''}
                onClick={e => {
                    if (this.props.id === 'Start') {
                        this.props.tabManager.setActive(this.props.id);
                        return;
                    }
                    if (e.ctrlKey) {
                        this.props.tabManager.close(this.props.id, e as any);
                        return;
                    }
                    if (e.shiftKey) {
                        this.props.tabManager.closeAll(e as any);
                        return;
                    }
                    this.props.tabManager.setActive(this.props.id);
                }}
                onMouseEnter={this.showDelete}
                onMouseLeave={this.showDelete}
                title={
                    this.props.id !== 'Start'
                        ? 'Ctrl+click close tab\nShift+click close all tabs (ignores unsaved changes)'
                        : ''
                }
            >
                <a>
                    {this.props.icon && (
                        <span className='icon'>
                            <i className={this.props.icon} aria-hidden='true' />
                        </span>
                    )}
                    <span>{this.props.title}</span>
                    {this.props.title !== 'Start' && this.state.delete && (
                        <button
                            className='delete is-small ml-3'
                            onClick={(e: any) => this.props.tabManager.close(this.props.id, e)}
                        />
                    )}
                </a>
            </li>
        );
    }
}

export default Tab;
