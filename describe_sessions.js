import mysql from 'mysql2';

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'afsana-db-6-june'
});

connection.query("DESCRIBE chat_sessions", (err, results) => {
  if (err) console.error(err);
  else console.log(results);
  process.exit(0);
});
