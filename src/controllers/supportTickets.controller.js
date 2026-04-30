import db from '../config/db.js';

// Create a new support ticket
export const createTicket = async (req, res) => {
  const { student_id, subject, description, priority } = req.body;

  if (!student_id || !subject || !description) {
    return res.status(400).json({ message: "Student ID, subject, and description are required" });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO support_tickets (student_id, subject, description, priority) VALUES (?, ?, ?, ?)`,
      [student_id, subject, description, priority || 'medium']
    );

    res.status(201).json({
      message: "Support ticket created successfully",
      ticket_id: result.insertId
    });
  } catch (error) {
    console.error("Error creating support ticket:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get tickets by student ID
export const getStudentTickets = async (req, res) => {
  const { student_id } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT * FROM support_tickets WHERE student_id = ? ORDER BY created_at DESC`,
      [student_id]
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching support tickets:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all tickets (for admin/support staff)
export const getAllTickets = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT st.*, s.full_name AS student_name, s.mobile_number 
       FROM support_tickets st
       LEFT JOIN students s ON st.student_id = s.id
       ORDER BY st.created_at DESC`
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching all support tickets:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update ticket status
export const updateTicketStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: "Status is required" });
  }

  try {
    const [result] = await db.query(
      `UPDATE support_tickets SET status = ? WHERE id = ?`,
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.status(200).json({ message: "Ticket status updated successfully" });
  } catch (error) {
    console.error("Error updating ticket status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
