import mysql from 'mysql2/promise';

(async () => {
  const conn = await mysql.createConnection({
    host: 'hopper.proxy.rlwy.net',
    user: 'root',
    password: 'KOCaXsSbXTjTbeacEiaIBlokLAANcete',
    database: 'railway',
    port: 16146
  });

  const [rows] = await conn.query("SELECT id, full_name, lead_status, new_leads, status FROM inquiries WHERE full_name LIKE '%testing%' ORDER BY id DESC LIMIT 5");
  console.log(JSON.stringify(rows, null, 2));
  await conn.end();
})();
