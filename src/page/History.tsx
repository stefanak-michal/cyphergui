import * as React from "react";
import { IPageProps } from "../utils/interfaces";

interface IHistoryProps extends IPageProps {}
interface IHistoryState {}

class History extends React.Component<IHistoryProps, IHistoryState> {
    render() {
        return <>history</>;
    }
}

export default History;
