import db from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config();


export const createNote = async (req, res) => {
  const { inquiry_id, counselor_id, student_id, staff_id, note, noteType } = req.body;
  console.log("req.body", req.body);

  try {
    // ✅ Insert query
    const query = `
      INSERT INTO notes (inquiry_id, counselor_id, staff_id, note, noteType)
      VALUES (?, ?, ?, ?,?)
    `;

    const [result] = await db.query(query, [
      inquiry_id || null,
      counselor_id || null,
      staff_id || null,
     // student_id || null,
      note || null,
      noteType || null
    ]);

    res.status(201).json({
      success: true,
      message: "Note created successfully",
      data: {
        id: result.insertId,
        inquiry_id,
        counselor_id,
        staff_id,
        note,
        noteType
        
      }
    });
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({
      success: false,
      message: "Error creating note",
      error: error.message
    });
  }
};


export const getNotesByInquiryId = async (req, res) => {
  const { inquiry_id } = req.params; // URL se inquiry_id milega

  try {
  const query = `
      SELECT 
        n.*, 
        uc.full_name AS counselor_name,     -- Counselor name
        us.full_name AS staff_name          -- Staff name
      FROM notes n
      LEFT JOIN inquiries i 
        ON n.inquiry_id = i.id
      LEFT JOIN users uc                   -- Counselor user
        ON i.counselor_id = uc.counselor_id
      LEFT JOIN users us                   -- Staff user
        ON n.staff_id = us.staff_id              -- join with staff_id
      WHERE n.inquiry_id = ?
      ORDER BY n.created_at DESC;
    `;

    const [rows] = await db.query(query, [inquiry_id]);

    res.status(200).json({
      success: true,
      message: "Notes with inquiry & counselor details fetched successfully",
      data: rows
    });
  } catch (error) {
    console.error("Error fetching notes with details:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching notes with details",
      error: error.message
    });
  }
};



// ✅ Update Note (same structure as createNote)
export const updateNote = async (req, res) => {
  const { id } = req.params; // id param
  const { inquiry_id, counselor_id, staff_id, note, noteType } = req.body;

  try {
    const query = `
      UPDATE notes
      SET inquiry_id = ?, counselor_id = ?, staff_id = ?, note = ?, noteType = ?
      WHERE id = ?
    `;

    const [result] = await db.query(query, [
      inquiry_id || null,
      counselor_id || null,
      staff_id || null,
      //student_id || null,
      note || null,
      noteType || null,
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    res.status(200).json({
      success: true,
      message: "Note updated successfully",
      data: {
        id,
        inquiry_id,
        counselor_id,
        staff_id,
      //student_id,
        note,
        noteType,
      },
    });
  } catch (error) {
    console.error("Error updating note:", error);
    res.status(500).json({
      success: false,
      message: "Error updating note",
      error: error.message,
    });
  }
};


export const deleteNote = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `DELETE FROM notes WHERE id = ?`;
    const [result] = await db.query(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    res.status(200).json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ success: false, message: "Error deleting note", error: error.message });
  }
};




