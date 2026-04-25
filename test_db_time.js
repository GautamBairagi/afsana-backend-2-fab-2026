import mysql from 'mysql2/promise';

async function test() {
  const connection = await mysql.createConnection({
    host: "hopper.proxy.rlwy.net",
    user: "root",
    password: "KOCaXsSbXTjTbeacEiaIBlokLAANcete",
    database: "railway",
    port: 16146
  });

  const [rows] = await connection.execute('SELECT created_at, NOW() as current_db_time, @@system_time_zone, @@time_zone FROM inquiries ORDER BY id DESC LIMIT 1');
  console.log(JSON.stringify(rows, null, 2));
  await connection.end();
}

test().catch(console.error);
