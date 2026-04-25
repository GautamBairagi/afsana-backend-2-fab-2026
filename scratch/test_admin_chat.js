import db from '../src/config/db.js';

async function testUserDetails(userId) {
    try {
        console.log(`Testing userDetails for userId: ${userId}`);
        const [userRows] = await db.query(
            `SELECT u.id, u.full_name, u.role FROM users u 
             WHERE (role IN ('admin', 'counselor', 'student', 'processors', 'masteradmin', 'staff'))
             GROUP BY u.id`,
            []
        );
        console.log(`Found ${userRows.length} users with matching roles.`);
        console.log("First 5 users:", userRows.slice(0, 5));
        
        const [groupRows] = await db.query(
            "SELECT * FROM `groups` WHERE FIND_IN_SET(?, user_ids)",
            [userId]
        );
        console.log(`Found ${groupRows.length} groups for user ${userId}.`);
        
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

testUserDetails(1);
