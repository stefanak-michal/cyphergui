import { Driver, Integer } from "neo4j-driver";

class Db {
    neo4j = require("neo4j-driver");
    driver: Driver | null = null;
    db: string | null = null;
    changeDbCallbacks: ((db: string) => void)[] = [];
    hasElementId: boolean = false;

    setDriver = (driver: Driver): void => {
        this.driver = driver;
    };

    getDriver = (): Driver => {
        return this.driver;
    };

    disconnect = () => {
        if (this.driver !== null) this.driver.close();
        this.driver = null;
    };

    setActiveDb = (db: string | null) => {
        this.db = db;
        for (let fn of this.changeDbCallbacks) fn(db);
    };

    getActiveDb = (): string => {
        return this.db;
    };

    registerChangeDbCallback = (fn: (db: string) => void) => {
        if (this.changeDbCallbacks.indexOf(fn) === -1) this.changeDbCallbacks.push(fn);
    };

    isInteger = (value: any): boolean => {
        return typeof value === "object" && "low" in value && "high" in value;
    };

    setHasElementId = (has: boolean) => {
        this.hasElementId = has;
    };

    fnId = (name: string = "n"): string => {
        return this.hasElementId ? "elementId(" + name + ")" : "id(" + name + ")";
    };

    strId = (id: Integer | string): string => {
        return id instanceof Integer ? this.neo4j.integer.toString(id) : id;
    };

    //singleton
    private static _instance: Db;
    static get instance(): Db {
        return this._instance || (this._instance = new this());
    }
}

const db = Db.instance;
export default db;
