import { Driver } from "neo4j-driver";
const neo4j = require("neo4j-driver");

let driver: Driver | null = null;
let db: string | null = null;
let changeDbCallbacks: ((db: string) => void)[] = [];

function setDriver(d: Driver): void {
    driver = d;
}

function getDriver(): Driver {
    return driver;
}

function disconnect(): void {
    if (driver !== null) driver.close();
    driver = null;
}

function setActiveDb(d: string | null): void {
    db = d;
    for (let fn of changeDbCallbacks) fn(db);
}

function getActiveDb(): string | null {
    return db;
}

function registerChangeDbCallback(fn: (db: string) => void) {
    if (changeDbCallbacks.indexOf(fn) === -1) changeDbCallbacks.push(fn);
}

function isInteger(value: any): boolean {
    return typeof value === "object" && "low" in value && "high" in value;
}

//todo bookmark manager

export { neo4j, getDriver, setDriver, disconnect, setActiveDb, getActiveDb, registerChangeDbCallback, isInteger };
