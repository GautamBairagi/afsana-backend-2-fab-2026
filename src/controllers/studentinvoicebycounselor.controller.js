import db from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config();

// CREATE Fee Record
export const createstudentinvoiceBycounselor = async (req, res) => {
  const { payment_amount, tax, additional_notes, total, student_id, payment_date } = req.body;
  try {
    // if (!payment_amount || !tax || !additional_notes || !total || !student_id || !payment_date) {
    //   return res.status(400).json({ message: 'All fields are required' });
    // }
    const query = `
      INSERT INTO student_invoice_by_counselor (payment_amount, tax, additional_notes, total, student_id,payment_date)
      VALUES (?, ?, ?, ?, ? , ?)`;
    const result = await db.query(query, [payment_amount, tax, additional_notes, total, student_id, payment_date]);
    if (result.affectedRows === 0) {
      return res.status(500).json({ message: "Failed to create invoice record" });
    }
    return res.status(200).json({ message: 'Student invoice created successfully', id: result.insertId });
  } catch (error) {
    console.log(`Internal server error: ${error}`);
    res.status(500).json(error.message);
  }
};



export const getstudentFeesByid = async (req, res) => {
  const { id } = req.params;
  try {
    const [fees] = await db.query(
      `
      SELECT f.*, s.full_name, s.email
FROM students s
JOIN student_fees_by_counselor f 
  ON s.id = f.student_name
WHERE s.id = ?
      `,
      [id]
    );
    if (fees.length === 0) {
      return res.status(404).json({ message: "No fee records found for this student." });
    }
    res.status(200).json(fees);
  } catch (err) {
    console.error("Error in getstudentFeesByid:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



// // GET All Fee Records
export const getallstudentBycounselor = async (req, res) => {
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


// // GET Fee by ID


// // UPDATE Fee Record
// export const updateStudentFee = async (req, res) => {
//   const { id } = req.params;
//   const { student_name, description, amount, status, fee_date } = req.body;

//   try {
//     const query = `
//       UPDATE student_fees
//       SET student_name = ?, description = ?, amount = ?, status = ?, fee_date = ?
//       WHERE id = ?`;

//     const result = await db.query(query, [
//       student_name, description, amount, status, fee_date, id
//     ]);

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ message: "Fee record not found" });
//     }

//     return res.status(200).json({ message: 'Student fee record updated successfully' });
//   } catch (error) {
//     console.log(`Internal server error: ${error}`);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };


// // DELETE Fee Record
// export const deleteStudentFee = async (req, res) => {
//   const { id } = req.params;
//   try {
//     const query = 'DELETE FROM student_fees WHERE id = ?';
//     const result = await db.query(query, [id]);

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ message: "Fee record not found" });
//     }

//     return res.status(200).json({ message: 'Student fee record deleted successfully' });
//   } catch (error) {
//     console.log(`Internal server error: ${error}`);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };

export const updatePaymentStatusBycounselor = async (req, res) => {
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
