import db from './src/config/db.js';

const checkDb = async () => {
  try {
    console.log('Testing connection to LIVE database...');
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    console.log('Connection successful! Result:', rows[0].result);

    console.log('\nChecking columns in "inquiries" table...');
    const [cols] = await db.query('SHOW COLUMNS FROM inquiries');
    console.log('Current columns:');
    cols.forEach(col => console.log(`- ${col.Field} (${col.Type})`));

    process.exit(0);
  } catch (err) {
    console.error('Database error:', err.message);
    process.exit(1);
  }
};

checkDb();
