import db from '../src/config/db.js';

const indexes = [
  {
    table: 'notifications',
    index: 'idx_notifications_counselor',
    columns: 'counselor_id',
  },
  {
    table: 'dashboard_notifications',
    index: 'idx_dash_notifications_student',
    columns: 'student_id',
  },
  {
    table: 'dashboard_notifications',
    index: 'idx_dash_notifications_counselor',
    columns: 'counselor_id',
  },
  {
    table: 'notes',
    index: 'idx_notes_inquiry',
    columns: 'inquiry_id',
  },
  {
    table: 'studentapplicationprocess',
    index: 'idx_app_student',
    columns: 'student_id',
  },
  {
    table: 'followuphistory',
    index: 'idx_followup_inq_next',
    columns: 'inquiry_id, next_followup_date',
  },
  {
    table: 'followuphistory',
    index: 'idx_followup_inq_last',
    columns: 'inquiry_id, last_followup_date',
  },
  {
    table: 'inquiries',
    index: 'idx_inquiries_search_branch',
    columns: 'branch, lead_status, created_at',
  },
  {
    table: 'visa_process',
    index: 'idx_visaprocess_student_uni',
    columns: 'student_id, university_id',
  },
];

async function createIndexes() {
  try {
    console.log('Starting index check and creation...');
    
    // Get DB name
    const [dbNameResult] = await db.query('SELECT DATABASE() AS db_name');
    const dbName = dbNameResult[0].db_name;
    console.log(`Using Database: ${dbName}`);

    for (const item of indexes) {
      const { table, index, columns } = item;
      
      // Check if index exists
      const [existing] = await db.query(
        `SELECT INDEX_NAME 
         FROM INFORMATION_SCHEMA.STATISTICS 
         WHERE TABLE_SCHEMA = ? 
           AND TABLE_NAME = ? 
           AND INDEX_NAME = ?`,
        [dbName, table, index]
      );

      if (existing.length > 0) {
        console.log(`✅ Index '${index}' on table '${table}' already exists.`);
      } else {
        console.log(`Adding index '${index}' on table '${table}'(${columns})...`);
        await db.query(`ALTER TABLE ${table} ADD INDEX ${index} (${columns})`);
        console.log(`🚀 Index '${index}' created successfully.`);
      }
    }

    console.log('🎉 Index optimization completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating indexes:', error.message || error);
    process.exit(1);
  }
}

createIndexes();
