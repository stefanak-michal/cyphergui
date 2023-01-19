import { Driver, Integer, Node as _Node, Relationship as _Relationship } from "neo4j-driver";

class Db {
    private _neo4j = require("neo4j-driver");
    private _driver: Driver;
    private activedb: string;
    private availableDatabases: string[] = [];
    private callbacks_1: ((database: string) => void)[] = [];
    private callbacks_2: ((databases: string[]) => void)[] = [];

    hasElementId: boolean = false;
    supportsMultiDb: boolean = false;

    get neo4j() {
        return this._neo4j;
    }

    set database(name: string) {
        if (this.databases.length > 0 && !this.databases.includes(name)) return;
        this.activedb = name;
        localStorage.setItem("activedb", name);
        for (let fn of this.callbacks_1) fn(name);
    }

    get database(): string {
        return this.activedb;
    }

    set databases(names: string[]) {
        this.availableDatabases = names;
        for (let fn of this.callbacks_2) fn(names);
    }

    get databases(): string[] {
        return this.availableDatabases;
    }

    setDriver = (driver: Driver, callback: (error?: Error) => void) => {
        this._driver = driver;

        driver
            .supportsMultiDb()
            .then(result => {
                this.supportsMultiDb = result;
                if (result) {
                    driver
                        .session({ defaultAccessMode: db.neo4j.session.READ })
                        .run("SHOW DATABASES")
                        .then(response => {
                            this.activedb = response.records.find(row => row.get("default")).get("name");
                            this.availableDatabases = response.records.filter(row => row.get("type") !== "system").map(row => row.get("name"));
                            const active = localStorage.getItem("activedb");
                            if (active && this.activedb !== active && this.availableDatabases.includes(active)) this.activedb = active;
                            callback();
                        })
                        .catch(callback);
                } else {
                    callback();
                }
            })
            .catch(callback);
    };

    get driver(): Driver {
        return this._driver;
    }

    disconnect = () => {
        if (this.driver) this.driver.close();
        this._driver = null;
    };

    registerChangeActiveDatabaseCallback = (fn: (db: string) => void) => {
        for (let _fn of this.callbacks_1) if (`${fn}` === `${_fn}`) return;
        this.callbacks_1.push(fn);
    };

    registerChangeDatabasesCallback = (fn: (databases: string[]) => void) => {
        for (let _fn of this.callbacks_2) if (`${fn}` === `${_fn}`) return;
        this.callbacks_2.push(fn);
    };

    isInteger = (value: any): boolean => {
        return value instanceof Integer;
    };

    fnId = (name: string = "n"): string => {
        return this.hasElementId ? "elementId(" + name + ")" : "id(" + name + ")";
    };

    strId = (id: Integer | string): string => {
        return this.isInteger(id) ? this.neo4j.integer.toString(id) : id;
    };

    getId = (entry: _Node | _Relationship, elementId: string = "elementId", identity: string = "identity"): number | string => {
        return this.hasElementId ? entry[elementId] : this.neo4j.integer.inSafeRange(entry[identity]) ? this.neo4j.integer.toNumber(entry[identity]) : this.neo4j.integer.toString(entry[identity]);
    };

    //singleton
    private static _instance: Db;
    static get instance(): Db {
        return this._instance || (this._instance = new this());
    }
}

const db = Db.instance;
export default db;
