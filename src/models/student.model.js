import db from '../config/db.js';

export const studentNameById = async (id) => {
    const [result] = await db.query('SELECT full_name FROM users WHERE student_id = ?', [id]);
    return result;
  };


  export const studentidentifying_name = async (id) => {
    const [result] = await db.query('SELECT identifying_name FROM students WHERE id = ?', [id]);
    return result;
  };


   export const processor_name = async (id) => {
    const [result] = await db.query('SELECT full_name FROM users WHERE id = ?', [id]);
    return result;
  };