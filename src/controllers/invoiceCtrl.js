import db from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config();
// CREATE Fee Record
export const createStudentFee = async (req, res) => { 
  const { student_name, description, amount, status, fee_date } = req.body;
  console.log("req.body", req.body);
  try {
    if (!student_name || !description || !amount || !status || !fee_date) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const query = `
      INSERT INTO student_fees (student_name, description, amount, status, fee_date)
      VALUES (?, ?, ?, ?, ?)`;
    const result = await db.query(query, [student_name, description, amount, status, fee_date]);

    if (result.affectedRows === 0) {
      return res.status(500).json({ message: "Failed to create fee record" });
    }
    return res.status(200).json({ message: 'Student fee record created successfully', id: result.insertId });
  } catch (error) {
    console.log(`Internal server error: ${error}`);
    res.status(500).json(error.message);
  }
};


 


// GET All Fee Records
export const getStudentFees = async (req, res) => {
  try {
    const query = 'SELECT * FROM student_fees';
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

// GET Fee by ID
export const getStudentFeeById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM student_fees WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Fee record not found" });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.log(`Internal server error: ${error}`);
    res.status(500).json({ message: 'Internal server error' });
  }
};



// UPDATE Fee Record
export const updateStudentFee = async (req, res) => {
  const { id } = req.params;
  const { student_name, description, amount, status, fee_date } = req.body;

  try {
    const query = `
      UPDATE student_fees
      SET student_name = ?, description = ?, amount = ?, status = ?, fee_date = ?
      WHERE id = ?`;

    const result = await db.query(query, [
      student_name, description, amount, status, fee_date, id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Fee record not found" });
    }

    return res.status(200).json({ message: 'Student fee record updated successfully' });
  } catch (error) {
    console.log(`Internal server error: ${error}`);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE Fee Record
export const deleteStudentFee = async (req, res) => {
  const { id } = req.params;
  try {
    const query = 'DELETE FROM student_fees WHERE id = ?';
    const result = await db.query(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Fee record not found" });
    }

    return res.status(200).json({ message: 'Student fee record deleted successfully' });
  } catch (error) {
    console.log(`Internal server error: ${error}`);
    res.status(500).json({ message: 'Internal server error' });
  }
};
