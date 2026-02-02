import db from '../config/db.js';

export const universityNameById = async (id) => {
    const [rows] = await db.query(
        'SELECT name FROM universities WHERE id = ?',
        [id]
      );
      // console.log("university name ", rows);
      return rows; 
};

export const BranchNameById = async (id) => {
    const [rows] = await db.query(
        'SELECT branch_name FROM branches WHERE id = ?',
        [id]
      );
      return rows; 
};

export const StudentNameById = async (id) => {
    const [rows] = await db.query(
        'SELECT full_name, student_id FROM users WHERE student_id = ?',
        [id]
      );
      return rows; 
};

export const StudentInvoiceById = async (id) => {
    const [rows] = await db.query(
        'SELECT * FROM student_invoice WHERE student_id = ?',
        [id]
      );
      return rows; 
};


