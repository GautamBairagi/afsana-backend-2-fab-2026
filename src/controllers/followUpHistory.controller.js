import db from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config();

export const createFollowUpHistory = async (req, res) => {
  const { inquiry_id, counselor_id, date, type, notes, next_followup_date, last_followup_date, status } = req.body;
  console.log("req.body", req.body);

  try {
    
    // Insert query
    const query = `
      INSERT INTO followuphistory (inquiry_id, counselor_id, date, type, notes, next_followup_date, last_followup_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(query, [inquiry_id, counselor_id, date, type, notes, next_followup_date, last_followup_date, status]);

    return res.status(201).json({
      message: 'Follow-up history created successfully',
    //  followupHistoryId: result.insertId
    });

  } catch (error) {
    console.error("Error creating follow-up history:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getInquiriesWithFollowUp = async (req, res) => {
  const { counselor_id } = req.params;

  try {
    if (!counselor_id) {
      return res.status(400).json({ message: 'counselor_id is required' });
    }

    const query = `
      SELECT 
        i.id AS inquiry_id,
        i.full_name,
        i.phone_number,
        i.email,
        i.source,
        i.branch,
        i.country,
        i.status,
        i.follow_up_date,
        i.notes,
        fh.id AS followup_id,
        fh.created_at AS followup_created_at
      FROM inquiries i
      LEFT JOIN followuphistory fh
        ON i.id = fh.inquiry_id
      WHERE fh.counselor_id = ?
      
    `;

    const [rows] = await db.query(query, [counselor_id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No data found for this counselor_id' });
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching inquiries with follow-up:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const updateFollowUpStatus = async (req, res) => {
  try {
    const { id, counselor_id, status } = req.body;

     const [result] = await db.query(
      "UPDATE followuphistory SET status = ? WHERE id = ? AND counselor_id = ?",
      [status, id, counselor_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Inquiry not found or counselor_id mismatch" });
    }

    res.status(200).json({ status: "true", message: "Followup status updated successfully" });
  } catch (error) {
    console.error("Error updating followup status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const getFollowUpHistoryByInquiryId = async (req, res) => {
  try {
    const { inquiry_id } = req.params;

    const [rows] = await db.query(
      `SELECT 
         fh.*,
         u.full_name AS counselor_name
       FROM followuphistory fh
       LEFT JOIN inquiries i 
         ON fh.inquiry_id = i.id
       LEFT JOIN users u 
         ON i.counselor_id = u.counselor_id
       WHERE fh.inquiry_id = ?`,
      [inquiry_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "No follow-up history found for this inquiry_id" });
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching follow-up history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const getInquiryWithFollowUpById = async (req, res) => {
  const { inquiry_id } = req.params;

  try {
    if (!inquiry_id) {
      return res.status(400).json({ message: 'inquiry_id is required' });
    }

    const query = `
      SELECT 
        i.id AS inquiry_id,
        i.full_name,
        i.phone_number,
        i.email,
        i.source,
        i.branch,
        i.country,
        i.status,
        i.follow_up_date,
        i.notes,
        fh.id AS followup_id,
        fh.counselor_id,
        fh.created_at AS followup_created_at
      FROM inquiries i
      LEFT JOIN followuphistory fh
        ON i.id = fh.inquiry_id
      WHERE fh.inquiry_id = ?
     
    `;

    const [rows] = await db.query(query, [inquiry_id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No data found for this inquiry_id' });
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching inquiry with follow-up:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteFollowUp = async (req, res) => {
  try {
    const [result] = await db.query(`DELETE FROM followuphistory WHERE id = ?`, [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Follow-up not found" });
    }

    res.json({ message: "Follow-up deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};


