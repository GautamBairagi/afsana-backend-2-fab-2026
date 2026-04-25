import db from '../src/config/db.js';

async function applyIndexes() {
    try {
        console.log('Applying indexes to inquiries table...');
        
        // Check if indexes already exist to avoid errors
        const [inquiryIndexes] = await db.query('SHOW INDEX FROM inquiries');
        const existingInquiryIndexes = inquiryIndexes.map(idx => idx.Key_name);

        if (!existingInquiryIndexes.includes('idx_inquiry_status')) {
            await db.query('CREATE INDEX idx_inquiry_status ON inquiries(lead_status)');
            console.log('✅ Added index: idx_inquiry_status');
        }
        if (!existingInquiryIndexes.includes('idx_inquiry_branch')) {
            await db.query('CREATE INDEX idx_inquiry_branch ON inquiries(branch)');
            console.log('✅ Added index: idx_inquiry_branch');
        }
        if (!existingInquiryIndexes.includes('idx_inquiry_counselor')) {
            await db.query('CREATE INDEX idx_inquiry_counselor ON inquiries(counselor_id)');
            console.log('✅ Added index: idx_inquiry_counselor');
        }
        if (!existingInquiryIndexes.includes('idx_inquiry_created')) {
            await db.query('CREATE INDEX idx_inquiry_created ON inquiries(created_at)');
            console.log('✅ Added index: idx_inquiry_created');
        }

        console.log('Applying indexes to followuphistory table...');
        const [historyIndexes] = await db.query('SHOW INDEX FROM followuphistory');
        const existingHistoryIndexes = historyIndexes.map(idx => idx.Key_name);

        if (!existingHistoryIndexes.includes('idx_history_inquiry_id')) {
            await db.query('CREATE INDEX idx_history_inquiry_id ON followuphistory(inquiry_id)');
            console.log('✅ Added index: idx_history_inquiry_id');
        }

        console.log('\n--- Final Index Check ---');
        const tables = ['inquiries', 'followuphistory'];
        for (const table of tables) {
            const [rows] = await db.query(`SHOW INDEX FROM ${table}`);
            console.table(rows.map(row => ({
                Table: row.Table,
                Key_name: row.Key_name,
                Column_name: row.Column_name
            })));
        }

        process.exit(0);
    } catch (error) {
        console.error('Error applying indexes:', error);
        process.exit(1);
    }
}

applyIndexes();
