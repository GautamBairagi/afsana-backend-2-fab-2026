import db from '../src/config/db.js';

async function migrate() {
    console.log('🚀 Starting live database migration...');

    try {
        // 1. Add photo column to users table
        console.log('--- Updating users table ---');
        try {
            await db.query(`ALTER TABLE users ADD COLUMN photo VARCHAR(500) DEFAULT NULL`);
            console.log('✅ Added "photo" column to users table');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️ "photo" column already exists in users table');
            } else {
                throw err;
            }
        }

        // 2. Add photo_url column to students table
        console.log('--- Updating students table ---');
        try {
            await db.query(`ALTER TABLE students ADD COLUMN photo_url VARCHAR(500) DEFAULT NULL`);
            console.log('✅ Added "photo_url" column to students table');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️ "photo_url" column already exists in students table');
            } else {
                throw err;
            }
        }

        // 3. Create student_uploads table
        console.log('--- Creating student_uploads table ---');
        await db.query(`
            CREATE TABLE IF NOT EXISTS student_uploads (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT,
                document_type VARCHAR(255),
                file_url VARCHAR(500),
                original_name VARCHAR(255),
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                notes TEXT,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ student_uploads table is ready');

        // 4. Create support_tickets table
        console.log('--- Creating support_tickets table ---');
        await db.query(`
            CREATE TABLE IF NOT EXISTS support_tickets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT,
                subject VARCHAR(255),
                description TEXT,
                priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
                status ENUM('open', 'in-progress', 'resolved', 'closed') DEFAULT 'open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ support_tickets table is ready');

        console.log('\n✨ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Migration failed:');
        console.error(error);
        process.exit(1);
    }
}

migrate();
