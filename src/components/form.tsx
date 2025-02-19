import { useLayoutEffect, useRef } from 'react';
import { EPage } from '../utils/enums';
import { ITabManager } from '../utils/interfaces';

export const Checkbox: React.FC<{
    name: string;
    label: string;
    color?: string;
    onChange?: (e: React.ChangeEvent) => void;
    checked?: boolean;
    disabled?: boolean;
    help?: string;
}> = ({ name, label, color, onChange, checked, disabled, help }) => {
    return (
        <div className='field'>
            <label className={'switch ' + (color || '')}>
                <input
                    type='checkbox'
                    name={name}
                    onChange={onChange}
                    checked={checked || false}
                    disabled={disabled || false}
                />
                <span className='slider' /> {label}
            </label>
            {help && <p className='help'>{help}</p>}
        </div>
    );
};

export const Textarea: React.FC<{
    name: string;
    value: string;
    onChange?: (e: React.ChangeEvent) => void;
    autoresize?: boolean;
    focus?: boolean;
    placeholder?: string;
    color?: string;
    required?: boolean;
    onKeyDown?: (e: React.KeyboardEvent) => void;
    highlight?: object;
}> = ({
    name,
    value,
    onChange,
    autoresize = true,
    focus = false,
    placeholder,
    color,
    required,
    onKeyDown,
    highlight,
}) => {
    const ref = useRef<HTMLTextAreaElement>(null);
    const highlightRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        resize();
        highlightText();
    }, [value]);

    const resize = () => {
        if (autoresize && ref.current) {
            ref.current.style.height = '0px';
            const computed = window.getComputedStyle(ref.current);
            ref.current.style.height =
                Math.ceil(parseFloat(computed.getPropertyValue('border-top-width'))) +
                ref.current.scrollHeight +
                Math.ceil(parseFloat(computed.getPropertyValue('border-bottom-width'))) +
                'px';
        }
    };

    const highlightText = () => {
        if (highlight && ref.current && highlightRef.current) {
            let text = ref.current.value;
            for (const color in highlight) {
                for (const keyword of highlight[color]) {
                    text = text.replace(
                        new RegExp('(?<!>)\\b' + keyword + '\\b(?!<)', 'gi'),
                        `<mark style="${color[0] === '#' ? 'color: ' + color : ''};">$&</mark>`
                    );
                }
            }
            highlightRef.current.innerHTML = text;
        }
    };

    return (
        <>
            {highlight && (
                <div className={'highlight-backdrop textarea ' + (color || '')}>
                    <div className='highlights' ref={highlightRef}></div>
                </div>
            )}

            <textarea
                name={name}
                className={'textarea ' + (color || '')}
                value={value}
                onChange={onChange}
                ref={ref}
                autoFocus={focus}
                placeholder={placeholder}
                required={required}
                onKeyDown={onKeyDown}
            />
        </>
    );
};

//maybe this should be somewhere else ...it is not really form ..hmm html.tsx?
export const Button: React.FC<{
    text?: string;
    icon?: string;
    color?: string;
    onClick?: (e?: any) => void;
    type?: 'submit' | 'reset' | 'button';
    title?: string;
    value?: string;
    children?: React.ReactNode;
    disabled?: boolean;
}> = ({ text, icon, color, onClick, type = 'button', title, value, children, disabled }) => {
    return (
        <button
            className={'button ' + (color || '')}
            onClick={onClick}
            type={type}
            title={title || ''}
            value={value}
            disabled={disabled || false}
        >
            {icon && (
                <span className='icon'>
                    <i className={icon} />
                </span>
            )}
            {text && <span>{text}</span>}
            {children}
        </button>
    );
};

export const LabelButton: React.FC<{
    label: string;
    database: string;
    size?: string;
    tabManager: ITabManager;
}> = ({ label, database, size, tabManager }) => {
    return (
        <Button
            color={'tag is-link is-rounded px-2 ' + (size || '')}
            onClick={() =>
                tabManager.add(label, 'fa-regular fa-circle', EPage.Label, {
                    label,
                    database,
                })
            }
            text={label.startsWith('*') ? '*' : ':' + label}
        />
    );
};

export const TypeButton: React.FC<{
    type: string;
    database: string;
    size?: string;
    tabManager: ITabManager;
}> = ({ type, database, size, tabManager }) => {
    return (
        <Button
            color={'tag is-info is-rounded px-2 has-text-white ' + (size || '')}
            onClick={() =>
                tabManager.add(type, 'fa-solid fa-arrow-right-long', EPage.Type, {
                    type,
                    database,
                })
            }
            text={type.startsWith('*') ? '*' : ':' + type}
        />
    );
};
