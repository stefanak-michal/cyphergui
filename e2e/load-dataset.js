import neo4j from 'neo4j-driver-lite';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.DB_HOSTNAME || 'bolt://localhost:7687';
const user = process.env.DB_USERNAME || 'neo4j';
const password = process.env.DB_PASSWORD;

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
const session = driver.session();

const cypherUrl = 'https://raw.githubusercontent.com/neo4j-graph-examples/movies/main/scripts/movies.cypher';

async function loadAndRunCypherQueries() {
    try {
        const response = await fetch(cypherUrl);
        const cypherQueries = await response.text();
        const queries = cypherQueries.split(';').filter(query => query.trim() !== '');

        for (const query of queries) {
            await session.run(query);
            console.log(`Executed query: ${query}`);
        }
    } catch (error) {
        console.error('Error loading or executing cypher queries:', error);
    } finally {
        await session.close();
        await driver.close();
    }
}

loadAndRunCypherQueries();
