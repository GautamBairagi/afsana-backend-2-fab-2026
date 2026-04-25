
import mysql from 'mysql2/promise';

const localConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'afsana_db_new',
    port: 3306
};

const liveConfig = {
    host: 'hopper.proxy.rlwy.net',
    user: 'root',
    password: 'KOCaXsSbXTjTbeacEiaIBlokLAANcete',
    database: 'railway',
    port: 16146
};

async function getSchema(config) {
    const connection = await mysql.createConnection(config);
    const [tables] = await connection.query('SHOW TABLES');
    const dbName = config.database;
    const schema = {};

    for (const tableRow of tables) {
        const tableName = Object.values(tableRow)[0];
        const [columns] = await connection.query(`SHOW COLUMNS FROM \`${tableName}\``);
        schema[tableName] = columns.map(c => ({
            field: c.Field,
            type: c.Type,
            null: c.Null,
            key: c.Key,
            default: c.Default,
            extra: c.Extra
        }));
    }
    await connection.end();
    return schema;
}

async function run() {
    try {
        console.log('Fetching local schema...');
        const localSchema = await getSchema(localConfig);
        console.log('Fetching live schema...');
        const liveSchema = await getSchema(liveConfig);

        const diff = {
            newTables: [],
            newColumns: []
        };

        // Check for new tables
        for (const tableName in localSchema) {
            if (!liveSchema[tableName]) {
                diff.newTables.push(tableName);
            } else {
                // Check for new columns in existing tables
                const localCols = localSchema[tableName];
                const liveCols = liveSchema[tableName].map(c => c.field);
                
                for (const col of localCols) {
                    if (!liveCols.includes(col.field)) {
                        diff.newColumns.push({
                            table: tableName,
                            column: col.field,
                            definition: `${col.type} ${col.null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.default !== null ? `DEFAULT '${col.default}'` : ''}`
                        });
                    }
                }
            }
        }

        console.log('--- COMPARISON RESULTS ---');
        console.log('Missing Tables on Live:', diff.newTables);
        console.log('Missing Columns on Live:', diff.newColumns);
        
        // Output for the model to parse
        console.log(JSON.stringify(diff));

    } catch (err) {
        console.error('Error:', err.message);
    }
}

run();
