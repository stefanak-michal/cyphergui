import db from "../db";
import { EPropertyType } from "./enums";
import { Duration } from "neo4j-driver";

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
            if (db.isInteger(value)) return parseFloat(db.strId(value));
            return value;
        },
        2
    );
}

export function resolvePropertyType(value: any): EPropertyType {
    if (typeof value === "number") return EPropertyType.Float;
    if (db.isInteger(value)) return EPropertyType.Integer;
    if (typeof value === "boolean") return EPropertyType.Boolean;
    if (Array.isArray(value)) return EPropertyType.List;
    if (db.neo4j.isDate(value)) return EPropertyType.Date;
    if (db.neo4j.isTime(value)) return EPropertyType.Time;
    if (db.neo4j.isDateTime(value)) return EPropertyType.DateTime;
    if (db.neo4j.isLocalTime(value)) return EPropertyType.LocalTime;
    if (db.neo4j.isLocalDateTime(value)) return EPropertyType.LocalDateTime;
    if (db.neo4j.isDuration(value)) return EPropertyType.Duration;
    if (db.neo4j.isPoint(value)) return EPropertyType.Point;
    return EPropertyType.String;
}

export function stringToDuration(value: string): Duration {
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

    return new Duration(db.neo4j.int(months), db.neo4j.int(days), db.neo4j.int(seconds), db.neo4j.int(nanoseconds));
}

export function durationToString(duration: Duration): string {
    let r: string = "P";

    const months = db.neo4j.integer.toNumber(duration.months);
    const years = Math.floor(months / 12);
    if (years > 0) r += years + "Y";
    if (months % 12 > 0) r += (months % 12) + "M";
    const days = db.neo4j.integer.toNumber(duration.days);
    if (days > 0) r += days + "D";

    let time: string = "";
    let seconds = db.neo4j.integer.toNumber(duration.seconds);
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
    const nano = db.neo4j.integer.toString(duration.nanoseconds);
    if (nano.length > 0 && nano !== "0") time += (time.length === 0 ? "0." : ".") + nano.substring(0, 6).replace(/0*$/, "");
    if (time.length > 0) r += (t ? "T" : "") + time + "S";

    return r;
}
