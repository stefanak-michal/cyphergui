import { Driver, Integer, Node as _Node, QueryResult, Relationship as _Relationship } from "neo4j-driver";
import { t_Log } from "./utils/types";
import { Ecosystem } from "./utils/enums";

class Db {
    private _neo4j = require("neo4j-driver");
    private _driver: Driver;
    private activedb: string = undefined;
    private availableDatabases: string[] = [];
    private callbacks_1: ((database: string) => void)[] = [];
    private callbacks_2: ((databases: string[]) => void)[] = [];

    hasElementId: boolean = false;
    logs: t_Log[] = [];
    ecosystem: Ecosystem = Ecosystem.Neo4j;

    get neo4j() {
        return this._neo4j;
    }

    set database(name: string) {
        if (this.databases.length === 0 || !this.databases.includes(name)) return;
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
            .getServerInfo()
            .then(r => {
                this.ecosystem = /memgraph/i.test(r.agent) ? Ecosystem.Memgraph : Ecosystem.Neo4j;
                this.hasElementId = this.ecosystem === Ecosystem.Neo4j && r["protocolVersion"] >= 5;

                this
                    .query("SHOW DATABASES")
                    .then(response => {
                        if (this.ecosystem === Ecosystem.Memgraph) {
                            this.activedb = response.records[0].get('Name');
                            this.availableDatabases = response.records.map(row => row.get("Name"));
                        } else {
                            this.activedb = response.records.find(row => row.get("default")).get("name");
                            this.availableDatabases = response.records.filter(row => row.get("type") !== "system").map(row => row.get("name"));
                        }
                        const active = localStorage.getItem("activedb");
                        if (active && this.activedb !== active && this.availableDatabases.includes(active)) this.activedb = active;
                        callback();
                    })
                    .catch(() => {
                        callback();
                    });
            })
            .catch(callback);
    };

    get driver(): Driver {
        return this._driver;
    }

    disconnect = () => {
        if (this._driver) this._driver.close();
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

    fnId = (name: string = "n"): string => {
        return this.hasElementId ? "elementId(" + name + ")" : "id(" + name + ")";
    };

    getId = (entry: _Node | _Relationship, elementId: string = "elementId", identity: string = "identity"): number | string => {
        return this.hasElementId ? entry[elementId] : this._neo4j.integer.inSafeRange(entry[identity]) ? this._neo4j.integer.toNumber(entry[identity]) : this._neo4j.integer.toString(entry[identity]);
    };

    isInt = (value: any): boolean => {
        return value instanceof Integer;
    };

    strInt = (id: Integer | string): string => {
        return this.isInt(id) ? this._neo4j.integer.toString(id) : id;
    };

    fromInt = (val: Integer): number => {
        return this._neo4j.integer.inSafeRange(val) ? this._neo4j.integer.toNumber(val) : parseFloat(this._neo4j.integer.toString(val));
    };

    toInt = (val: number | string): Integer => {
        return this._neo4j.int(val);
    };

    query = (stmt: string, params: object = {}, db: string = undefined): Promise<QueryResult> => {
        return new Promise(async (resolve, reject) => {
            try {
                const session = this._driver.session({ database: db });
                const result = await session.run(stmt, params);
                await session.close();
                this.logs = this.logs.concat({ query: stmt, params: params, status: true, date: new Date() } as t_Log).slice(-1000);
                resolve({ records: result.records, summary: result.summary } as QueryResult);
            } catch (err) {
                this.logs = this.logs.concat({ query: stmt, params: params, status: false, date: new Date() } as t_Log).slice(-1000);
                reject(err);
            }
        });
    };

    //singleton
    private static _instance: Db;
    static get instance(): Db {
        return this._instance || (this._instance = new this());
    }
}

const db = Db.instance;
export default db;
