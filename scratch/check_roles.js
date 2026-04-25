import db from '../src/config/db.js';

async function checkRoles() {
    try {
        const [roles] = await db.query('SELECT role, COUNT(*) as count FROM users GROUP BY role');
        console.log('--- User Roles in Database ---');
        console.table(roles);

        process.exit(0);
    } catch (error) {
        console.error('Error checking roles:', error);
        process.exit(1);
    }
}

checkRoles();
