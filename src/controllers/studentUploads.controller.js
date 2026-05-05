import db from '../config/db.js';
import { v2 as cloudinary } from "cloudinary";
import fs from 'fs';

// Upload new document
export const uploadDocument = async (req, res) => {
  const { student_id, document_type, uploaded_by, uploader_id, university_id } = req.body;
  const file = req.files?.document;

  if (!student_id || !document_type || !file) {
    return res.status(400).json({ message: "Student ID, Document Type, and File are required" });
  }

  try {
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "student_documents",
      resource_type: "auto"
    });

    const file_url = result.secure_url;
    const original_name = file.name;

    const [insertResult] = await db.query(
      `INSERT INTO student_uploads (student_id, document_type, file_url, original_name, uploaded_by, uploader_id, university_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [student_id, document_type, file_url, original_name, uploaded_by || 'student', uploader_id || null, university_id || null]
    );

    // ✅ Optional: Notification to student if uploaded by processor
    if (uploaded_by === 'processor') {
        // notification logic here
    }

    if (fs.existsSync(file.tempFilePath)) {
      fs.unlinkSync(file.tempFilePath);
    }

    res.status(201).json({
      message: "Document uploaded successfully",
      id: insertResult.insertId,
      file_url,
      original_name
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get documents by student_id
export const getStudentDocuments = async (req, res) => {
  const { student_id } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT * FROM student_uploads WHERE student_id = ? ORDER BY uploaded_at DESC`,
      [student_id]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all documents (for Processor/Admin)
export const getAllStudentDocuments = async (req, res) => {
  const { role, staff_id } = req.query;

  try {
    let query = `
      SELECT su.*, s.full_name AS student_name, u.email, s.mobile_number, s.country, univ.name AS university_name 
      FROM student_uploads su
      LEFT JOIN students s ON su.student_id = s.id
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN universities univ ON su.university_id = univ.id
    `;
    let params = [];

    // If role is processor, only show documents of students assigned to them
    if ((role === 'processors' || role === 'processor') && staff_id) {
      query += ` WHERE s.processor_id = ? `;
      params.push(staff_id);
    }

    query += ` ORDER BY su.id DESC`;

    const [rows] = await db.query(query, params);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching all documents:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Update document status (for Admin/Processor)
export const updateDocumentStatus = async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  try {
    const [result] = await db.query(
      `UPDATE student_uploads SET status = ?, notes = ? WHERE id = ?`,
      [status, notes || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.status(200).json({ message: "Document status updated successfully" });
  } catch (error) {
    console.error("Error updating document status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete document
export const deleteDocument = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query(`DELETE FROM student_uploads WHERE id = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.status(200).json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
