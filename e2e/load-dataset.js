import neo4j from 'neo4j-driver-lite';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.DB_HOSTNAME || 'bolt://localhost:7687';
const username = process.env.DB_USERNAME || 'neo4j';
const password = process.env.DB_PASSWORD;
const cypherUrl = 'https://raw.githubusercontent.com/neo4j-graph-examples/movies/main/scripts/movies.cypher';

async function loadAndRunCypherQueries() {
    let session, driver;
    try {
        driver = neo4j.driver(uri, username.length > 0 && password.length > 0 ? neo4j.auth.basic(username, password) : undefined, {
            userAgent: 'stefanak-michal/cypherGUI',
            telemetryDisabled: true
        });
        const serverInfo = await driver.getServerInfo()
        console.log('Connection established')
        console.log(serverInfo)

        const response = await fetch(cypherUrl);
        const cypherQueries = await response.text();
        const queries = cypherQueries.split(';').filter(query => query.trim() !== '');

        session = driver.session({
            defaultAccessMode: neo4j.session.WRITE
        });
        for (const query of queries) {
            await session.run(query);
            console.log(`Executed query: ${query}`);
        }
    } catch (error) {
        console.error('Error loading or executing cypher queries:', error);
        process.exit(1);
    } finally {
        await session?.close();
        await driver?.close();
    }
}

loadAndRunCypherQueries();
