import db from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config();

// CREATE Fee Record
export const createstudentinvoice = async (req, res) => {
  const { payment_amount, tax, additional_notes, total, student_id , payment_date} = req.body;
  try {
    // if (!payment_amount || !tax || !additional_notes || !total || !student_id || !payment_date) {
    //   return res.status(400).json({ message: 'All fields are required' });
    // }
    const query = `
      INSERT INTO student_invoice (payment_amount, tax, additional_notes, total, student_id,payment_date)
      VALUES (?, ?, ?, ?, ? , ?)`;
    const result = await db.query(query, [payment_amount, tax, additional_notes, total, student_id,payment_date]);
    if (result.affectedRows === 0) {
      return res.status(500).json({ message: "Failed to create invoice record" });
    }
    return res.status(200).json({ message: 'Student invoice created successfully', id: result.insertId });
  } catch (error) {
    console.log(`Internal server error: ${error}`);
    res.status(500).json(error.message);
  }
};

// // GET All Fee Records
export const getallstudent = async (req, res) => {
  try {
    const query = "SELECT student_id, full_name FROM users WHERE role = 'student'";
    const [result] = await db.query(query);
    if (result.length === 0) {
      return res.status(404).json({ message: "No student fees found" });
    }
    return res.status(200).json(result);
  } catch (error) {
    console.log(`Internal server error: ${error}`);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const updatePaymentStatus = async (req, res) => {
  try {
    const { student_id } = req.params;
    const { payment_status } = req.body;
    if (!payment_status) {
      return res.status(400).json({ message: "payment_status is required." });
    }
    const query = `UPDATE payments SET payment_status = ? WHERE id = ?`;
    const [result] = await db.query(query, [payment_status, student_id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "No payment record found for this student." });
    }
    return res.status(200).json({ message: "Payment status updated successfully." });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};
