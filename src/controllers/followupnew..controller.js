import db from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config();

// ✅ Create Follow-Up
export const createFollowUp = async (req, res) => {
  const {
    user_id,
    counselor_id,
    inquiry_id,
    name,
    title,
    description,
    status = 'Pending',
    follow_up_date,
    urgency_level,
    department,
  } = req.body;

  // Validate required fields
  if (
    !user_id || !counselor_id || !inquiry_id ||
    !name || !title || !description ||
    !urgency_level || !department || !follow_up_date
  ) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO follow_upsnew 
        (user_id, counselor_id, inquiry_id, name, title, description, status, follow_up_date, urgency_level, department) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        counselor_id,
        inquiry_id,
        name,
        title,
        description,
        status,
        follow_up_date,
        urgency_level,
        department
      ]
    );

    res.status(201).json({
      message: "Follow-up created successfully",
      followUpId: result.insertId
    });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

// ✅ Get All Follow-Ups
export const getAllFollowUps = async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM follow_upsnew ORDER BY follow_up_date DESC`);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

// ✅ Get Follow-Up by ID
export const getFollowUpById = async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM follow_upsnew WHERE id = ?`, [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Follow-up not found" });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

// ✅ Get Follow-Ups by Inquiry ID
export const getFollowUpsByInquiryId = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM follow_upsnew WHERE inquiry_id = ? ORDER BY follow_up_date DESC`,
      [req.params.inquiry_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};



export const getFollowUpsByCoueloerid = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM follow_upsnew WHERE counselor_id = ? ORDER BY follow_up_date DESC`,
      [req.params.counselor_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

// ✅ Update Follow-Up
export const updateFollowUp = async (req, res) => {
  const {
    title,
    description,
    follow_up_date,
    status,
    urgency_level,
    department,
  } = req.body;

  try {
    const [result] = await db.query(
      `UPDATE follow_upsnew 
       SET title = ?, description = ?, follow_up_date = ?, status = ?, urgency_level = ?, department = ?
       WHERE id = ?`,
      [title, description, follow_up_date, status, urgency_level, department, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Follow-up not found" });
    }

    res.json({ message: "Follow-up updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

// ✅ Delete Follow-Up
export const deleteFollowUp = async (req, res) => {
  try {
    const [result] = await db.query(`DELETE FROM follow_upsnew WHERE id = ?`, [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Follow-up not found" });
    }

    res.json({ message: "Follow-up deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};
