import db from '../config/db.js';

export const getPriorityList = async (req, res) => {
    try {
        const counselor_id = req.user?.id || req.query.counselor_id;

        let query;
        let params = [];

        if (counselor_id) {
            // Counselor view: show ALL their assigned WhatsApp/AI leads, sorted by priority
            query = `
                SELECT id, full_name, phone_number, email, country, priority, date_of_inquiry, 
                       office_visit_date, passport, sop, lead_status, source
                FROM inquiries 
                WHERE assigned_staff_id = ?
                AND lead_status NOT IN ('Converted', 'Rejected')
                AND source IN ('Whatsapp', 'WhatsApp AI', 'Website')
                ORDER BY 
                    CASE priority WHEN 'High' THEN 1 WHEN 'hot' THEN 2 WHEN 'warm' THEN 3 ELSE 4 END,
                    date_of_inquiry DESC
                LIMIT 30
            `;
            params.push(counselor_id);
        } else {
            // Admin view: show all High priority leads
            query = `
                SELECT id, full_name, phone_number, email, country, priority, date_of_inquiry, 
                       office_visit_date, passport, sop, lead_status, source
                FROM inquiries 
                WHERE priority IN ('High', 'hot')
                AND lead_status NOT IN ('Converted', 'Rejected')
                ORDER BY date_of_inquiry DESC
                LIMIT 30
            `;
        }

        const [results] = await db.query(query, params);
        res.status(200).json(results);
    } catch (error) {
        console.error("Error fetching priority list:", error);
        res.status(500).json({ error: "Failed to fetch priority list" });
    }
};

export const getAppointmentsList = async (req, res) => {
    try {
        const counselor_id = req.user?.id || req.query.counselor_id;

        let query = `
            SELECT id, full_name, phone_number, email, country, office_visit_date, inquiry_type 
            FROM inquiries 
            WHERE office_visit_date IS NOT NULL
        `;
        let params = [];

        if (counselor_id) {
            query += ` AND assigned_staff_id = ?`;
            params.push(counselor_id);
        }

        query += ` ORDER BY office_visit_date ASC LIMIT 50`;

        const [results] = await db.query(query, params);
        res.status(200).json(results);
    } catch (error) {
        console.error("Error fetching appointments:", error);
        res.status(500).json({ error: "Failed to fetch appointments" });
    }
};

export const getDripLogs = async (req, res) => {
    try {
        const query = `
            SELECT d.id, d.campaign_type, d.status, d.scheduled_date, d.sent_date, i.full_name, i.phone_number
            FROM drip_campaign_logs d
            JOIN inquiries i ON d.lead_id = i.id
            ORDER BY d.created_at DESC
            LIMIT 100
        `;
        const [results] = await db.query(query);
        res.status(200).json(results);
    } catch (error) {
        console.error("Error fetching drip logs:", error);
        res.status(500).json({ error: "Failed to fetch drip campaign logs" });
    }
};
