import mysql from 'mysql2';
import fs from 'fs';
import path from 'path';

// Parse database credentials
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'afsana-db-6-june',
  multipleStatements: true
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    process.exit(1);
  }
  console.log('Connected to database successfully.');

  // Read the SQL file
  const sqlPath = path.resolve('../phase2_migrations.sql');
  const sqlString = fs.readFileSync(sqlPath, 'utf8');

  // Execute the SQL queries
  connection.query(sqlString, (err, results) => {
    if (err) {
      console.error('Error running migrations:', err);
    } else {
      console.log('Migrations executed successfully!');
      console.log('Results:', results);
    }
    
    // Close connection
    connection.end();
    process.exit(err ? 1 : 0);
  });
});
