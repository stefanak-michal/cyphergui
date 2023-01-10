import { Driver, Integer } from "neo4j-driver";

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
        if (this.databases.length > 0 && this.databases.indexOf(name) === -1) return;
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

    setDriver = (driver: Driver, callback: () => void) => {
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
                            if (active && this.activedb !== active) this.activedb = active;
                            callback();
                        })
                        .catch(console.error);
                } else {
                    callback();
                }
            })
            .catch(console.error);
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

    //singleton
    private static _instance: Db;
    static get instance(): Db {
        return this._instance || (this._instance = new this());
    }
}

const db = Db.instance;
export default db;
