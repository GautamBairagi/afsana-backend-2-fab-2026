import mysql from 'mysql2/promise';

async function checkIndexes() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'finaltestiingafsana'
  });

  try {
    const [inquiriesIndexes] = await connection.execute('SHOW INDEX FROM inquiries');
    console.log('Indexes in inquiries:', inquiriesIndexes.map(idx => ({ Table: idx.Table, Column: idx.Column_name, Key_name: idx.Key_name })));

    const [historyIndexes] = await connection.execute('SHOW INDEX FROM followuphistory');
    console.log('Indexes in followuphistory:', historyIndexes.map(idx => ({ Table: idx.Table, Column: idx.Column_name, Key_name: idx.Key_name })));

    const [rowCountInquiries] = await connection.execute('SELECT COUNT(*) as total FROM inquiries');
    console.log('Total rows in inquiries:', rowCountInquiries[0].total);

    const [rowCountHistory] = await connection.execute('SELECT COUNT(*) as total FROM followuphistory');
    console.log('Total rows in followuphistory:', rowCountHistory[0].total);

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

checkIndexes();
