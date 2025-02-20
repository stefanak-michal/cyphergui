import { createContext, UIEvent } from 'react';
import { t_ShowPropertiesModalFn, t_ToastFn } from './types';

export const ToastContext = createContext<t_ToastFn>(null);

export const ClipboardContext = createContext<(e: UIEvent) => void>(null);

export const PropertiesModalContext = createContext<t_ShowPropertiesModalFn>(null);

export const ThemeSwitchContext = createContext<() => void>(null);
