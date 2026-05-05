import db from '../src/config/db.js';

async function updateTable() {
    try {
        console.log("Checking student_uploads table columns...");
        const [columns] = await db.query(`SHOW COLUMNS FROM student_uploads`);
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('uploaded_by')) {
            await db.query(`ALTER TABLE student_uploads ADD COLUMN uploaded_by VARCHAR(50) DEFAULT 'student'`);
            console.log("Column 'uploaded_by' added.");
        }

        if (!columnNames.includes('uploader_id')) {
            await db.query(`ALTER TABLE student_uploads ADD COLUMN uploader_id INT NULL`);
            console.log("Column 'uploader_id' added.");
        }

        if (!columnNames.includes('university_id')) {
            await db.query(`ALTER TABLE student_uploads ADD COLUMN university_id INT NULL`);
            console.log("Column 'university_id' added.");
        }

        if (!columnNames.includes('notes')) {
            await db.query(`ALTER TABLE student_uploads ADD COLUMN notes TEXT NULL`);
            console.log("Column 'notes' added.");
        }

        console.log("Table student_uploads updated successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Error updating table:", err.message);
        process.exit(1);
    }
}

updateTable();
