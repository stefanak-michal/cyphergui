import db from "../db";
import { EPropertyType } from "./enums";
import {
    DateTime as _DateTime,
    Duration as _Duration,
    LocalDateTime as _LocalDateTime,
    LocalTime as _LocalTime,
    Point as _Point,
    Time as _Time
} from "neo4j-driver-lite";
import { t_FormProperty, t_FormValue } from "./types";
import * as React from "react";
import { Checkbox } from "../components/form";

export function toJSON(data: any[] | object): string {
    let obj;
    if (Array.isArray(data)) {
        obj = [];
        data.forEach(row => {
            let entry = {};
            for (let key of row.keys) entry[key] = row.get(key);
            obj.push(entry);
        });
    } else if (typeof data === "object") {
        obj = data;
    }

    return JSON.stringify(
        obj,
        (key, value) => {
            if (db.isInt(value)) return db.fromInt(value);
            return value;
        },
        2
    );
}

export function resolvePropertyType(value: any): EPropertyType {
    if (typeof value === "number") return EPropertyType.Float;
    if (db.isInt(value)) return EPropertyType.Integer;
    if (typeof value === "boolean") return EPropertyType.Boolean;
    if (Array.isArray(value)) return EPropertyType.List;
    if (db.neo4j.isDate(value)) return EPropertyType.Date;
    if (db.neo4j.isTime(value)) return EPropertyType.Time;
    if (db.neo4j.isDateTime(value)) return EPropertyType.DateTime;
    if (db.neo4j.isLocalTime(value)) return EPropertyType.LocalTime;
    if (db.neo4j.isLocalDateTime(value)) return EPropertyType.LocalDateTime;
    if (db.neo4j.isDuration(value)) return EPropertyType.Duration;
    if (db.neo4j.isPoint(value)) return EPropertyType.Point;
    if (typeof value === "object") return EPropertyType.Map; // has to be last to check
    return EPropertyType.String;
}

export function getPropertyAsTemp(type: EPropertyType, value: any): any {
    switch (type) {
        case EPropertyType.Integer:
            return db.strInt(value);
        case EPropertyType.DateTime:
            return (() => {
                const [date, timepart] = value.toString().split("T");
                const time = timepart.substring(0, 8);
                const tz = db.fromInt((value as _DateTime).timeZoneOffsetSeconds) / 60 / 60;
                const nanosec = db.strInt((value as _DateTime).nanosecond);
                return [date, time, nanosec, tz];
            })();
        case EPropertyType.Duration:
            return durationToString(value as _Duration);
        case EPropertyType.LocalDateTime:
            return (() => {
                const [date, timepart] = value.toString().split("T");
                const time = timepart.substring(0, 8);
                const nanosec = db.strInt((value as _LocalDateTime).nanosecond);
                return [date, time, nanosec];
            })();
        case EPropertyType.LocalTime:
            return [(value as _LocalTime).toString().substring(0, 8), db.strInt((value as _LocalTime).nanosecond)];
        case EPropertyType.Point:
            const srid = db.strInt((value as _Point).srid);
            return ["4979", "9157"].includes(srid) ? [srid, (value as _Point).x, (value as _Point).y, (value as _Point).z] : [srid, (value as _Point).x, (value as _Point).y];
        case EPropertyType.Time:
            return [(value as _Time).toString().substring(0, 8), db.strInt((value as _Time).nanosecond), db.fromInt((value as _Time).timeZoneOffsetSeconds) / 60 / 60];

        case EPropertyType.List:
        case EPropertyType.Map:
            return null;

        case EPropertyType.String:
        case EPropertyType.Boolean:
            return null;

        case EPropertyType.Float:
        case EPropertyType.Date:
        default:
            return value ? value.toString() : null;
    }
}

export function cypherPrintProperties(properties: t_FormProperty[]): string {
    return "{" + properties.map(p => p.key + ": " + cypherPrintProperty(p)).join(", ") + "}";
}

function cypherPrintProperty(property: t_FormProperty | t_FormValue): string {
    if (property.value === null) return "null";
    switch (property.type) {
        case EPropertyType.String:
            return "'" + (property.value as string).replaceAll("'", "\\'").replaceAll("\n", "\\n") + "'";
        case EPropertyType.Integer:
            return property.temp;
        case EPropertyType.Boolean:
            return property.value ? "true" : "false";
        case EPropertyType.List:
            return "[" + (property.value as t_FormValue[]).map(entry => cypherPrintProperty(entry)).join(", ") + "]";
        case EPropertyType.Map:
            return "{" + (property.value as t_FormValue[]).map(entry => entry.key + ": " + cypherPrintProperty(entry)).join(", ") + "}";
        case EPropertyType.Point:
            return "point({srid: " + property.temp[0] + ", x: " + property.temp[1] + ", y: " + property.temp[2] + (property.temp.length === 4 ? ", z: " + property.temp[3] : "") + "})";
        case EPropertyType.Date:
            return "date('" + property.temp + "')";
        case EPropertyType.DateTime:
            return "datetime('" + property.value.toString() + "')";
        case EPropertyType.Time:
            return "time('" + property.value.toString() + "')";
        case EPropertyType.LocalTime:
            return "localtime('" + property.value.toString() + "')";
        case EPropertyType.LocalDateTime:
            return "localdatetime('" + property.value.toString() + "')";
        case EPropertyType.Duration:
            return "duration('" + property.temp + "')";
        default:
            return property.value.toString();
    }
}

export function stringToDuration(value: string): _Duration {
    let months = 0;
    let days = 0;
    let seconds = 0;
    let nanoseconds = 0;

    const [date, time] = value.substring(1).split("T");

    if (date) {
        for (let m of date.match(/[\d\.]+[A-Z]/g) || []) {
            switch (m.slice(-1)) {
                case "Y":
                    months += parseInt(m.slice(0, -1)) * 12;
                    break;
                case "M":
                    months += parseInt(m.slice(0, -1));
                    break;
                case "D":
                    days = parseInt(m.slice(0, -1));
                    break;
            }
        }
    }

    if (time) {
        for (let m of time.match(/[\d\.]+[A-Z]/g) || []) {
            switch (m.slice(-1)) {
                case "H":
                    seconds += parseInt(m.slice(0, -1)) * 60 * 60;
                    break;
                case "M":
                    seconds += parseInt(m.slice(0, -1)) * 60;
                    break;
                case "S":
                    const [sec, nano] = m.slice(0, -1).split(".", 2);
                    seconds += parseInt(sec);
                    nanoseconds = parseInt(nano);
                    break;
            }
        }
    }

    return new _Duration(db.toInt(months), db.toInt(days), db.toInt(seconds), db.toInt(nanoseconds));
}

export function durationToString(duration: _Duration): string {
    let r: string = "P";

    const months = db.fromInt(duration.months);
    const years = Math.floor(months / 12);
    if (years > 0) r += years + "Y";
    if (months % 12 > 0) r += (months % 12) + "M";
    const days = db.fromInt(duration.days);
    if (days > 0) r += days + "D";

    let time: string = "";
    let seconds = db.fromInt(duration.seconds);
    const hours = Math.floor(seconds / 3600);
    if (hours > 0) time += hours + "H";
    const minutes = Math.floor((seconds % 3600) / 60);
    if (minutes > 0) time += minutes + "M";
    let t = true;
    if (time.length > 0) {
        r += "T" + time;
        t = false;
    }

    time = "";
    if ((seconds % 3600) % 60 > 0) time += (seconds % 3600) % 60;
    const nano = db.strInt(duration.nanoseconds);
    if (nano.length > 0 && nano !== "0") time += (time.length === 0 ? "0." : ".") + nano.substring(0, 6).replace(/0*$/, "");
    if (time.length > 0) r += (t ? "T" : "") + time + "S";

    return r;
}

export function sanitizeFormValues(properties: t_FormProperty[]): {} {
    const props = {};
    for (let p of properties) {
        if (p.type === EPropertyType.List) {
            props[p.key] = [];
            (p.value as t_FormValue[]).forEach(entry => { props[p.key].push(entry.value); });
        } else if (p.type === EPropertyType.Map) {
            props[p.key] = {};
            (p.value as t_FormValue[]).forEach(entry => { props[p.key][entry.key] = entry.value; });
        } else {
            props[p.key] = p.value;
        }
    }
    return props;
}

export function printProperty(property: any): string | React.ReactElement {
    if (db.isInt(property)) return db.strInt(property);
    if (Array.isArray(property)) return "[" + property.join(", ") + "]";
    if (typeof property === "boolean") return <Checkbox name="" label="" checked={property} disabled />;
    if (property.constructor.name === "Object") return "{" + Object.keys(property).map(key => key + ": " + printProperty(property[key])).join(", ") + "}";
    return property.toString();
}
