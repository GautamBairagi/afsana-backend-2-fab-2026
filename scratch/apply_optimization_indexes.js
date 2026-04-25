import mysql from 'mysql2/promise';

async function optimizeDatabase() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'finaltestiingafsana'
  });

  try {
    console.log('Starting Database Optimization...');

    // 1. Add indexes to inquiries table
    console.log('Adding indexes to inquiries table...');
    await connection.execute('ALTER TABLE inquiries ADD INDEX idx_lead_status (lead_status)');
    await connection.execute('ALTER TABLE inquiries ADD INDEX idx_branch (branch)');
    await connection.execute('ALTER TABLE inquiries ADD INDEX idx_counselor (counselor_id)');
    await connection.execute('ALTER TABLE inquiries ADD INDEX idx_status (new_leads)');
    await connection.execute('ALTER TABLE inquiries ADD INDEX idx_created_at (created_at)');

    // 2. Add indexes to followuphistory table
    console.log('Adding indexes to followuphistory table...');
    await connection.execute('ALTER TABLE followuphistory ADD INDEX idx_inquiry_id (inquiry_id)');
    await connection.execute('ALTER TABLE followuphistory ADD INDEX idx_next_followup (next_followup_date)');
    await connection.execute('ALTER TABLE followuphistory ADD INDEX idx_last_followup (last_followup_date)');

    console.log('✅ Database Optimization Completed Successfully!');

  } catch (err) {
    if (err.code === 'ER_DUP_KEYNAME') {
      console.log('⚠️ Some indexes already exist. Skipping them...');
    } else {
      console.error('❌ Error optimizing database:', err);
    }
  } finally {
    await connection.end();
  }
}

optimizeDatabase();
