import * as React from "react";
import { t_ToastFn } from "./types";

export const ToastContext = React.createContext<t_ToastFn>(null);

export const ClipboardContext = React.createContext<(e: React.UIEvent) => void>(null);
