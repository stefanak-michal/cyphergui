import * as React from 'react';
import { t_ShowPropertiesModalFn, t_ToastFn } from './types';

export const ToastContext = React.createContext<t_ToastFn>(null);

export const ClipboardContext = React.createContext<(e: React.UIEvent) => void>(null);

export const PropertiesModalContext = React.createContext<t_ShowPropertiesModalFn>(null);

export const ThemeSwitchContext = React.createContext<() => void>(null);
