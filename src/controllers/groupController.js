import db from '../config/db.js';

// Helper: get allowed contact user IDs for a given userId
const getAllowedContactIds = async (userId) => {
    const [userRows] = await db.query(
        "SELECT id, role, student_id, counselor_id FROM users WHERE id = ?",
        [userId]
    );
    if (userRows.length === 0) return null; // user not found

    const currentUser = userRows[0];
    const role = currentUser.role?.toLowerCase();

    // Admins/masteradmin see everyone → return null to skip filtering
    if (role === 'admin' || role === 'masteradmin' || role === 'superadmin') {
        return null;
    }

    const allowed = new Set();

    // Add users who have an existing chat history with this user
    const [chatPartners] = await db.query(
        `SELECT DISTINCT sender_id, receiver_id FROM chats 
         WHERE TRIM(sender_id) = ? COLLATE utf8mb4_unicode_ci 
            OR TRIM(receiver_id) = ? COLLATE utf8mb4_unicode_ci`,
        [String(userId), String(userId)]
    );
    chatPartners.forEach(row => {
        if (String(row.sender_id) !== String(userId) && row.sender_id) allowed.add(Number(row.sender_id));
        if (String(row.receiver_id) !== String(userId) && row.receiver_id) allowed.add(Number(row.receiver_id));
    });

    if (role === 'student') {
        // Student sees their assigned counselor + processor
        const [studentInfo] = await db.query(
            "SELECT counselor_id, processor_id FROM students WHERE id = ?",
            [currentUser.student_id]
        );
        if (studentInfo.length > 0) {
            const { counselor_id, processor_id } = studentInfo[0];
            // counselors.id → get the user via counselors.user_id
            if (counselor_id) {
                const [cUsers] = await db.query(
                    "SELECT u.id FROM users u JOIN counselors c ON u.id = c.user_id WHERE c.id = ?",
                    [counselor_id]
                );
                cUsers.forEach(u => allowed.add(u.id));
            }
            // processor_id in students = users.id of the processor directly
            if (processor_id) {
                allowed.add(processor_id);
            }
        }
    } else if (role === 'counselor') {
        // counselor: users.counselor_id = counselors.id
        // We need students where students.counselor_id = this counselor's counselors.id
        const [students] = await db.query(
            `SELECT u.id as user_id FROM students s 
             JOIN users u ON u.student_id = s.id 
             WHERE s.counselor_id = ?`,
            [currentUser.counselor_id]
        );
        students.forEach(s => allowed.add(s.user_id));
    } else if (role === 'processor' || role === 'processors') {
        // processor_id in students = users.id of the processor
        const [students] = await db.query(
            `SELECT u.id as user_id FROM students s 
             JOIN users u ON u.student_id = s.id 
             WHERE s.processor_id = ?`,
            [userId]
        );
        students.forEach(s => allowed.add(s.user_id));
    }

    return Array.from(allowed);
};

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
        console.log("🔍 Fetching userDetails for userId:", userId);

        const allowedIds = await getAllowedContactIds(userId);

        let userRows;
        if (allowedIds === null) {
            // Admin: fetch everyone
            [userRows] = await db.query(
                `SELECT u.*, 
                    (SELECT COUNT(*) FROM chats WHERE TRIM(receiver_id) = TRIM(?) COLLATE utf8mb4_unicode_ci AND TRIM(sender_id) = TRIM(CAST(u.id AS CHAR)) COLLATE utf8mb4_unicode_ci AND is_read = 0) as unread_count,
                    (SELECT MAX(created_at) FROM chats WHERE (TRIM(sender_id) = TRIM(?) COLLATE utf8mb4_unicode_ci AND TRIM(receiver_id) = TRIM(CAST(u.id AS CHAR)) COLLATE utf8mb4_unicode_ci) OR (TRIM(sender_id) = TRIM(CAST(u.id AS CHAR)) COLLATE utf8mb4_unicode_ci AND TRIM(receiver_id) = TRIM(?) COLLATE utf8mb4_unicode_ci)) as last_message_time
                 FROM users u 
                 WHERE u.id != ?
                 GROUP BY u.id
                 ORDER BY last_message_time DESC`,
                [userId, userId, userId, userId]
            );
        } else if (allowedIds.length === 0) {
            userRows = [];
        } else {
            [userRows] = await db.query(
                `SELECT u.*, 
                    (SELECT COUNT(*) FROM chats WHERE TRIM(receiver_id) = TRIM(?) COLLATE utf8mb4_unicode_ci AND TRIM(sender_id) = TRIM(CAST(u.id AS CHAR)) COLLATE utf8mb4_unicode_ci AND is_read = 0) as unread_count,
                    (SELECT MAX(created_at) FROM chats WHERE (TRIM(sender_id) = TRIM(?) COLLATE utf8mb4_unicode_ci AND TRIM(receiver_id) = TRIM(CAST(u.id AS CHAR)) COLLATE utf8mb4_unicode_ci) OR (TRIM(sender_id) = TRIM(CAST(u.id AS CHAR)) COLLATE utf8mb4_unicode_ci AND TRIM(receiver_id) = TRIM(?) COLLATE utf8mb4_unicode_ci)) as last_message_time
                 FROM users u 
                 WHERE u.id IN (?)
                 GROUP BY u.id
                 ORDER BY last_message_time DESC`,
                [userId, userId, userId, allowedIds]
            );
        }

        const [groupRows] = await db.query(
            "SELECT * FROM `groups` WHERE FIND_IN_SET(?, user_ids)",
            [userId]
        );

        console.log(`✅ Found ${userRows.length} users and ${groupRows.length} groups for userId ${userId}`);

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
        // Get the user id of the counselor
        const [userRows] = await db.query("SELECT id FROM users WHERE counselor_id = ?", [counselor_id]);
        const userId = userRows[0]?.id;

        if (!userId) {
            return res.status(404).json({ message: "Counselor user not found" });
        }

        const allowedIds = await getAllowedContactIds(userId);

        let allContacts = [];
        if (allowedIds === null) {
            // Admin: fetch everyone
            [allContacts] = await db.query(
                `SELECT u.*, 
                    (SELECT COUNT(*) FROM chats WHERE TRIM(receiver_id) = TRIM(?) COLLATE utf8mb4_unicode_ci AND TRIM(sender_id) = TRIM(CAST(u.id AS CHAR)) COLLATE utf8mb4_unicode_ci AND is_read = 0) as unread_count,
                    (SELECT MAX(created_at) FROM chats WHERE (TRIM(sender_id) = TRIM(?) COLLATE utf8mb4_unicode_ci AND TRIM(receiver_id) = TRIM(CAST(u.id AS CHAR)) COLLATE utf8mb4_unicode_ci) OR (TRIM(sender_id) = TRIM(CAST(u.id AS CHAR)) COLLATE utf8mb4_unicode_ci AND TRIM(receiver_id) = TRIM(?) COLLATE utf8mb4_unicode_ci)) as last_message_time
                 FROM users u 
                 WHERE u.id != ?
                 GROUP BY u.id`,
                [userId, userId, userId, userId]
            );
        } else if (allowedIds.length > 0) {
            [allContacts] = await db.query(
                `SELECT u.*,
                    (SELECT COUNT(*) FROM chats WHERE TRIM(receiver_id) = TRIM(?) COLLATE utf8mb4_unicode_ci AND TRIM(sender_id) = TRIM(CAST(u.id AS CHAR)) COLLATE utf8mb4_unicode_ci AND is_read = 0) as unread_count,
                    (SELECT MAX(created_at) FROM chats WHERE (TRIM(sender_id) = TRIM(?) COLLATE utf8mb4_unicode_ci AND TRIM(receiver_id) = TRIM(CAST(u.id AS CHAR)) COLLATE utf8mb4_unicode_ci) OR (TRIM(sender_id) = TRIM(CAST(u.id AS CHAR)) COLLATE utf8mb4_unicode_ci AND TRIM(receiver_id) = TRIM(?) COLLATE utf8mb4_unicode_ci)) as last_message_time
                 FROM users u WHERE u.id IN (?)
                 GROUP BY u.id`,
                [userId, userId, userId, allowedIds]
            );
        }

        const [groupRows] = await db.query(
            "SELECT * FROM `groups` WHERE FIND_IN_SET(?, user_ids)",
            [userId]
        );

        res.json({
            users: allContacts,
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
        // Get the user row for this student
        const [rows] = await db.query(
            `SELECT u.id FROM users u WHERE u.student_id = ?`,
            [student_id]
        );
        const userId = rows[0]?.id;

        if (!userId) {
            return res.status(404).json({ message: "Student user not found" });
        }

        const allowedIds = await getAllowedContactIds(userId);

        let counselorData = [];
        if (allowedIds === null) {
            // Admin: fetch everyone
            [counselorData] = await db.query(
                `SELECT u.*, 
                    (SELECT COUNT(*) FROM chats WHERE TRIM(receiver_id) = TRIM(?) COLLATE utf8mb4_unicode_ci AND TRIM(sender_id) = TRIM(CAST(u.id AS CHAR)) COLLATE utf8mb4_unicode_ci AND is_read = 0) as unread_count,
                    (SELECT MAX(created_at) FROM chats WHERE (TRIM(sender_id) = TRIM(?) COLLATE utf8mb4_unicode_ci AND TRIM(receiver_id) = TRIM(CAST(u.id AS CHAR)) COLLATE utf8mb4_unicode_ci) OR (TRIM(sender_id) = TRIM(CAST(u.id AS CHAR)) COLLATE utf8mb4_unicode_ci AND TRIM(receiver_id) = TRIM(?) COLLATE utf8mb4_unicode_ci)) as last_message_time
                 FROM users u 
                 WHERE u.id != ?
                 GROUP BY u.id`,
                [userId, userId, userId, userId]
            );
        } else if (allowedIds.length > 0) {
            [counselorData] = await db.query(
                `SELECT u.*, 
                    (SELECT COUNT(*) FROM chats WHERE TRIM(receiver_id) = TRIM(?) COLLATE utf8mb4_unicode_ci AND TRIM(sender_id) = TRIM(CAST(u.id AS CHAR)) COLLATE utf8mb4_unicode_ci AND is_read = 0) as unread_count,
                    (SELECT MAX(created_at) FROM chats WHERE (TRIM(sender_id) = TRIM(?) COLLATE utf8mb4_unicode_ci AND TRIM(receiver_id) = TRIM(CAST(u.id AS CHAR)) COLLATE utf8mb4_unicode_ci) OR (TRIM(sender_id) = TRIM(CAST(u.id AS CHAR)) COLLATE utf8mb4_unicode_ci AND TRIM(receiver_id) = TRIM(?) COLLATE utf8mb4_unicode_ci)) as last_message_time
                 FROM users u
                 WHERE u.id IN (?)
                 GROUP BY u.id`,
                [userId, userId, userId, allowedIds]
            );
        }

        const [groupRows] = await db.query(
            "SELECT * FROM `groups` WHERE FIND_IN_SET(?, user_ids)",
            [userId]
        );

        res.json({
            users: counselorData,
            groups: groupRows,
        });
    } catch (error) {
        console.error("Error fetching assigned counselor:", error);
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
