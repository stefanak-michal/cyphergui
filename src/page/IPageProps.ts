import * as React from "react";
import { EPage } from "../enums";

export default interface IPageProps {
    active: boolean;
    tabName: string;
    addTab: (title: string, icon: string, component: EPage, props?: object, active?: boolean) => void;
    removeTab: (title: string, e?: React.PointerEvent) => void;
    generateTabName: (prefix: string) => string;
    toast: (message: string, color?: string, delay?: number) => void;
}
