import db from '../config/db.js';

export const getUserById = async (user_id) => {
  const query = `SELECT * FROM users WHERE id = ?`;
  const [rows] = await db.execute(query, [user_id]);
  return rows[0];
};

export const getAllUsers = async () => {
  const query = `SELECT id, full_name, email FROM users`;
  const [rows] = await db.execute(query);
  return rows;
};