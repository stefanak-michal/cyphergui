import db from "../db";
import { EPropertyType } from "./enums";

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
