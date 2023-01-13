import db from "../db";

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
