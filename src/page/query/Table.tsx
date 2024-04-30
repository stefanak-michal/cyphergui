import * as React from "react";
import db from "../../db";
import InlineNode from "../../components/InlineNode";
import InlineRelationship from "../../components/InlineRelationship";
import {
    Date as _Date,
    DateTime as _DateTime,
    Duration as _Duration,
    LocalDateTime as _LocalDateTime,
    LocalTime as _LocalTime,
    Time as _Time,
    Record,
    Node as _Node,
    Path as _Path,
    Relationship as _Relationship
} from "neo4j-driver-lite";
import { settings } from "../../layout/Settings";
import { durationToString, toJSON } from "../../utils/fn";
import { ClipboardContext } from "../../utils/contexts";
import { ITabManager } from "../../utils/interfaces";

interface ITableProps {
    keys: string[];
    rows: Record[],
    tableSize: number;
    tabManager: ITabManager
}

class Table extends React.Component<ITableProps, {}> {
    render() {
        return (
            <div className="table-container">
                <table className="table is-bordered is-striped is-narrow is-hoverable">
                    <thead>
                    <tr>
                        {this.props.keys.map(key => (
                            <th key={key}>{key}</th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {this.props.rows.map((row, i) => (
                        <tr key={i}>
                            {this.props.keys.map(key => (
                                <td key={key}>{row.has(key) ? this.printValue(row.get(key)) : ""}</td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        );
    }

    printValue = (value: any): React.ReactElement => {
        if (db.isInt(value)) return <>{db.strInt(value)}</>;
        if (Array.isArray(value)) return <>[
            {value.length ? value
                .map<React.ReactNode>(entry => this.printValue(entry))
                .reduce((prev, curr) => [prev, ", ", curr]) : ""}
            ]</>;
        if (value === null) return <p className="has-text-grey">null</p>;
        if (typeof value === "boolean") return <>{value ? "true" : "false"}</>;
        if (typeof value === "string") return <p className="wspace-pre is-inline-block">{value}</p>;

        if (value instanceof _Node) {
            return <InlineNode node={value} tabManager={this.props.tabManager} small={this.props.tableSize === 1} />;
        }
        if (value instanceof _Relationship) {
            return <InlineRelationship rel={value} tabManager={this.props.tabManager} small={this.props.tableSize === 1} />;
        }
        if (value instanceof _Path) {
            let start = value.start;
            let first = true;
            return (
                <div className="is-flex is-align-items-center">
                    {value.segments.map(segment => {
                        const r = (
                            <>
                                {first && (
                                    <>
                                        <span className="is-size-4">(</span>
                                        {this.printValue(db.strInt(segment.start.identity) === db.strInt(start.identity) ? segment.start : segment.end)}
                                        <span className="is-size-4">)</span>
                                    </>
                                )}
                                <span className="is-size-4 wspace-nowrap">{db.strInt(segment.start.identity) === db.strInt(start.identity) ? "-" : "<-"}[</span>
                                {this.printValue(segment.relationship)}
                                <span className="is-size-4 wspace-nowrap">]{db.strInt(segment.start.identity) === db.strInt(start.identity) ? "->" : "-"}(</span>
                                {this.printValue(db.strInt(segment.start.identity) === db.strInt(start.identity) ? segment.end : segment.start)}
                                <span className="is-size-4">)</span>
                            </>
                        );
                        start = segment.end;
                        first = false;
                        return r;
                    })}
                </div>
            );
        }

        // Temporal values
        if (value instanceof _Date) {
            const fn = settings().temporalValueToStringFunction === "toString" ? "toDateString" : settings().temporalValueToStringFunction;
            return <p className="wspace-nowrap">{value.toStandardDate()[fn]()}</p>;
        }
        if (value instanceof _DateTime) return <p className="wspace-nowrap">{value.toStandardDate()[settings().temporalValueToStringFunction]()}</p>;
        if (value instanceof _Time) return <p className="wspace-nowrap">{value.toString()}</p>;
        if (value instanceof _LocalDateTime) return <p className="wspace-nowrap">{value.toStandardDate().toLocaleString()}</p>;
        if (value instanceof _LocalTime) return <p className="wspace-nowrap">{value.toString()}</p>;
        if (value instanceof _Duration) return <p className="wspace-nowrap">{durationToString(value)}</p>;

        if (typeof value === "object") {
            return (
                <>
                    {value.constructor.name || ""}
                    <div className="control has-icons-right">
                        <pre>{toJSON(value)}</pre>
                        <ClipboardContext.Consumer>
                            {copy => (
                                <span className="icon is-right is-clickable" onClick={copy}>
                                    <i className="fa-regular fa-copy" />
                                </span>
                            )}
                        </ClipboardContext.Consumer>
                    </div>
                </>
            );
        }

        return value.toString();
    };
}

export default Table;
