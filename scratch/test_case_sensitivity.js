import db from '../src/config/db.js';

async function testInsert() {
    try {
        console.log("Testing insert with lowercase 'interview' field...");
        const data = {
            student_id: 1, // dummy
            university_id: 1, // dummy
            interview: '0' // lowercase
        };
        const query = `INSERT INTO studentapplicationprocess SET ?`;
        const [result] = await db.query(query, data);
        console.log("Success! ID:", result.insertId);
        
        // Clean up dummy data if possible, but user said don't delete. 
        // I'll use a transaction and rollback instead.
    } catch (err) {
        console.error("Caught expected error:", err.message);
    }
}

async function testWithTransaction() {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        console.log("Testing insert with lowercase 'interview' field in transaction...");
        const data = {
            student_id: 1,
            university_id: 1,
            interview: '0'
        };
        const query = `INSERT INTO studentapplicationprocess SET ?`;
        await connection.query(query, data);
        console.log("Success! (Rolling back)");
    } catch (err) {
        console.error("Error in transaction:", err.message);
    } finally {
        await connection.rollback();
        connection.release();
    }
}

testWithTransaction();
