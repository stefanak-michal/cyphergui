const neo4j = require('neo4j-driver')

let driver = null;

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

export { neo4j, getDriver, setDriver, disconnect }
