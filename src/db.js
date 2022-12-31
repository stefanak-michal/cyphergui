const neo4j = require('neo4j-driver')

let driver = null;
let db = null;
let changeDbCallbacks = [];

function setDriver(d) {
    driver = d;
}

function getDriver() {
    return driver;
}

function disconnect() {
    if (driver !== null)
        driver.close();
    driver = null;
}

function setActiveDb(d) {
    db = d;
    for (let fn of changeDbCallbacks)
        fn(db);
}

function getActiveDb() {
    return db;
}

function registerChangeDbCallback(fn) {
    if (changeDbCallbacks.indexOf(fn) === -1)
        changeDbCallbacks.push(fn);
}

//todo bookmark manager

export { neo4j, getDriver, setDriver, disconnect, setActiveDb, getActiveDb, registerChangeDbCallback }
