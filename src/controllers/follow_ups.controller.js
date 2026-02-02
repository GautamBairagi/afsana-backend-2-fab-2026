import db from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config();

export const createFollowUp = async (req, res) => {
    const { name, title, follow_up_date, status, urgency_level, department, user_id } = req.body;
    if (!name || !title || !follow_up_date || !status || !urgency_level || !department || !user_id) {
      return res.status(400).json({ message: "All fields are required." });
    }
  
    try {
      const [result] = await db.query(
        `INSERT INTO follow_ups (name, title, follow_up_date, status, urgency_level, department, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, title, follow_up_date, status, urgency_level, department, user_id]
      );

      res.status(201).json({
        message: "Follow-up added successfully",
        followUpId: result.insertId
      });
    } catch (err) {
      console.error("Create Follow-up error:", err);
      res.status(500).json({ message: "Internal server error", error: err.message });
    }
  };

  export const getAllFollowUps = async (_, res) => {
    try {
      const [rows] = await db.query("SELECT * FROM follow_ups");
      res.status(200).json(rows);
    } catch (err) {
      console.error("Get Follow-ups error:", err);
      res.status(500).json({ message: "Internal server error", error: err.message });
    }
  };
  export const getFollowUpById = async (req, res) => {
    const { id } = req.params;
    try {
      const [rows] = await db.query("SELECT * FROM follow_ups WHERE id = ?", [id]);
      if (rows.length === 0) {
        return res.status(404).json({ message: "Follow-up not found" });
      }
      res.status(200).json(rows[0]);
    } catch (err) {
      console.error("Get Follow-up by ID error:", err);
      res.status(500).json({ message: "Internal server error", error: err.message });
    }
  };

  export const updateFollowUp = async (req, res) => {
    const { id } = req.params;
    const { name, title, follow_up_date, status, urgency_level, department, user_id } = req.body;
    if (!name || !title || !follow_up_date || !status || !urgency_level || !department || !user_id) {
      return res.status(400).json({ message: "All fields are required." });
    }

    try {
      const [result] = await db.query(
        `UPDATE follow_ups SET name = ?, title = ?, follow_up_date = ?, status = ?, urgency_level = ?, department = ?, user_id = ? WHERE id = ?`,
        [name, title, follow_up_date, status, urgency_level, department, user_id, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Follow-up not found" });
      }

      res.status(200).json({ message: "Follow-up updated successfully" });
    } catch (err) {
      console.error("Update Follow-up error:", err);
      res.status(500).json({ message: "Internal server error", error: err.message });
    }
  };

  export const deleteFollowUp = async (req, res) => {
    const { id } = req.params;
    try {
      const [result] = await db.query("DELETE FROM follow_ups WHERE id = ?", [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Follow-up not found" });
      }

      res.status(200).json({ message: "Follow-up deleted successfully" });
    } catch (err) {
      console.error("Delete Follow-up error:", err);
      res.status(500).json({ message: "Internal server error", error: err.message });
    }
  };


  
