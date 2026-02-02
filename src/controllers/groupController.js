import db from '../config/db.js';




export const createGroup = async (req, res) => {
    const { group_name, user_ids, created_by } = req.body;

    try {
        const [result] = await db.query(
            "INSERT INTO `groups` (group_name, user_ids, created_by) VALUES (?, ?, ?)",
            [group_name, user_ids, created_by]
        );

        res.json({ success: true, result });
    } catch (error) {
        console.error("❌ Group creation error:", error);
        res.status(500).json({ message: "Failed to create group", error: error.message });
    }
};


export const userDetails = async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ message: 'Missing userId in query' });
    }

    try {
        const [userRows] = await db.query(
            "SELECT * FROM users WHERE role IN ('admin', 'counselor' , 'student' , 'processors')",
        );

        const [groupRows] = await db.query(
            "SELECT * FROM `groups` WHERE FIND_IN_SET(?, user_ids)",
            [userId]
        );

        res.json({
            users: userRows,
            groups: groupRows
        });
    } catch (error) {
        console.error("Error fetching user/group details:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getAssignedStudents = async (req, res) => {
    const { counselor_id } = req.query;

    try {
        const [students] = await db.query(
            `SELECT *  FROM students WHERE counselor_id = ?`,
            [counselor_id]
        );

        const [groupRows] = await db.query(
            "SELECT *  FROM `groups` WHERE FIND_IN_SET(?, user_ids)",
            [counselor_id]
        );
        const [counselorData] = await db.query(
            "SELECT *  FROM users WHERE role IN ('admin', 'counselor' , 'processors')",
        );
        res.json({
            users: [...students, ...counselorData],
            groups: groupRows,
        });
    } catch (error) {
        console.error("Error fetching assigned students:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
export const getAssignedcounselor = async (req, res) => {
    const { student_id } = req.query;

    try {
        const [students] = await db.query(
            `SELECT  * FROM students WHERE id = ?`,
            [student_id]
        );
        const counselor_id = students[0]?.counselor_id;
        const [counselorData] = await db.query(
            "SELECT *  FROM users WHERE counselor_id = ?",
            [counselor_id]
        );

        const [groupRows] = await db.query(
            "SELECT * FROM `groups` WHERE FIND_IN_SET(?, user_ids)",
            [counselor_id]
        );

        res.json({
            users: counselorData,
            groups: groupRows,
        });
    } catch (error) {
        console.error("Error fetching assigned students:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


export const getGroupMessages = async (req, res) => {
    const { groupId } = req.params;
    const query = `
    SELECT m.*, u.full_name 
    FROM messages m 
    JOIN users u ON u.id = m.sender_id 
    WHERE m.group_id = ? 
    ORDER BY m.timestamp ASC
  `;
    const [rows] = await db.query(query, [groupId]);
    res.json({ messages: rows });
};

export const getMyGroups = async (req, res) => {
    const { userId } = req.params;
    const query = `
    SELECT g.id, g.name, g.created_at 
    FROM group_chats g 
    JOIN group_members m ON g.id = m.group_id 
    WHERE m.user_id = ?
  `;
    const [groups] = await db.query(query, [userId]);
    res.json({ groups });
};

export const allGroups = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM `groups`");
        res.json({ groups: rows });
    } catch (error) {
        console.error("Error fetching all groups:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
export const deleteGroup = async (req, res) => {
    const { groupId } = req.params;

    try {

        await db.query("DELETE FROM messages WHERE group_id = ?", [groupId]);

        await db.query("DELETE FROM `groups` WHERE id = ?", [groupId]);

        res.json({ success: true, message: "Group deleted successfully" });

    } catch (error) {
        console.error("Error deleting group:", error);
        res.status(500).json({ success: false, message: "Failed to delete group", error: error.message });
    }
}