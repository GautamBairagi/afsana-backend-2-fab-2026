// Migration: Add assigned_staff_id and office_visit_date to inquiries table
// Run once: node src/migrations/addAssignedStaffId.js

import db from '../config/db.js';

const runMigration = async () => {
  try {
    console.log('🚀 Running migration: addAssignedStaffId...');

    // Check if assigned_staff_id column already exists
    const [cols] = await db.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'inquiries' 
      AND COLUMN_NAME IN ('assigned_staff_id', 'office_visit_date')
    `);

    const existingCols = cols.map(c => c.COLUMN_NAME);

    if (!existingCols.includes('assigned_staff_id')) {
      await db.query(`
        ALTER TABLE inquiries 
        ADD COLUMN assigned_staff_id INT NULL DEFAULT NULL
      `);
      console.log('✅ Column assigned_staff_id added to inquiries table.');
    } else {
      console.log('ℹ️  Column assigned_staff_id already exists. Skipping.');
    }

    if (!existingCols.includes('office_visit_date')) {
      await db.query(`
        ALTER TABLE inquiries 
        ADD COLUMN office_visit_date DATETIME NULL DEFAULT NULL
      `);
      console.log('✅ Column office_visit_date added to inquiries table.');
    } else {
      console.log('ℹ️  Column office_visit_date already exists. Skipping.');
    }

    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
};

runMigration();
