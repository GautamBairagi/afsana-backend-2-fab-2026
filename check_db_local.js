import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config({ path: './src/.env' });

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME
});

connection.connect((err) => {
  if (err) {
    console.error('Connection error:', err.message);
    process.exit(1);
  }
  console.log('Successfully connected to local MySQL');
  connection.query('SHOW DATABASES', (err, results) => {
    if (err) {
      console.error('Query error:', err.message);
    } else {
      console.log('Databases:', results.map(r => r.Database));
    }
    connection.end();
  });
});
