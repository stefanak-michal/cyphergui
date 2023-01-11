import { Duration as _Duration } from "neo4j-driver";
import db from "../db";
export default class Duration {
    private d: _Duration;
    constructor(props: _Duration) {
        this.d = props;
    }

    get duration(): _Duration {
        return this.d;
    }

    toString = (): string => {
        let r: string = "P";

        const months = db.neo4j.integer.toNumber(this.d.months);
        const years = Math.floor(months / 12);
        if (years > 0) r += years + "Y";
        if (months % 12 > 0) r += (months % 12) + "M";
        const days = db.neo4j.integer.toNumber(this.d.days);
        if (days > 0) r += days + "D";

        let time: string = "";
        let seconds = db.neo4j.integer.toNumber(this.d.seconds);
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
        const nano = db.neo4j.integer.toString(this.d.nanoseconds);
        if (nano.length > 0 && nano !== "0") time += (time.length === 0 ? "0." : ".") + nano.substring(0, 6).replace(/0*$/, "");
        if (time.length > 0) r += (t ? "T" : "") + time + "S";

        return r;
    };
}
