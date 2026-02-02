import db from '../config/db.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { universityNameById } from '../models/universities.model.js';
dotenv.config();
// export const createCounselor = async (req, res) => {
//   const {
//     user_id,
//     full_name,
//     email,
//     phone,
//     university,
//     password,
//     role,
//     status
//   } = req.body;

//   try {
//     const [result] = await db.query(
//       `INSERT INTO counselors (user_id, name, email, phone, university, status)
//        VALUES (?, ?, ?, ?, ?, ?)`,
//       [user_id, name, email, phone, university, status]
//     );

//     res.status(201).json({ message: 'Counselor created successfully', counselorId: result.insertId });
//   } catch (err) {
//     console.error('Create Counselor error:', err);
//     res.status(500).json({ message: 'Internal server error', error: err.message });
//   }
// };

export const createCounselor = async (req, res) => {
  console.log("req.body : ", req.body);

  const {
    user_id,
    full_name,
    email,
    phone,
    university_id,
    password,
    role,
    status
  } = req.body;

  try {

    if (!user_id || !full_name || !email || !phone || !university_id || !password || !role) {
      return res.status(400).json({ message: 'All required fields must be filled' });
    }


    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'User already exists' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const [counselorResult] = await db.query(
      `INSERT INTO counselors (user_id,  phone, university_id, status)
         VALUES (?, ?, ?, ?)`,
      [user_id, phone, university_id, status]
    );

    if (!counselorResult.affectedRows) {
      return res.status(400).json({ message: 'Counselor not added properly' });
    }

    const counselorId = counselorResult.insertId;


    const [userResult] = await db.query(
      'INSERT INTO users (email, password, full_name, role, user_id, counselor_id) VALUES (?, ?, ?, ?, ?, ?)',
      [email, hashed, full_name, role, user_id, counselorId]
    );

    if (!userResult.insertId) {
      return res.status(400).json({ message: 'User creation failed' });
    }

    res.status(201).json({ message: 'Counselor created successfully' });

  } catch (err) {
    console.error('Create Counselor error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

export const getCounselorById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      `
        SELECT 
          c.*, 
          u.email, u.full_name, u.role 
        FROM counselors c 
        JOIN users u ON c.id = u.counselor_id
        WHERE c.id = ?
        `,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Counselor not found' });
    }
    const counselor = rows[0];
    const university_name = await universityNameById(counselor.university_id);
    const response = {
      id: counselor.id,
      user_id: counselor.user_id,
      email: counselor.email,
      phone: counselor.phone,
      university: university_name[0]?.name,
      status: counselor.status,
      full_name: counselor.full_name,
      role: counselor.role,
    };
    res.status(200).json(response);
  } catch (err) {
    console.error('Get Counselor error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateCounselor = async (req, res) => {
  const { id } = req.params;
  const {
    user_id,
    full_name,
    email,
    phone,
    university_id,
    status
  } = req.body;
  try {
    const [result] = await db.query(
      `UPDATE counselors
         SET user_id = ?,  phone = ?, university_id = ?, status = ?
         WHERE id = ?`,
      [user_id, phone, university_id, status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Counselor not found' });
    }
    const [userResult] = await db.query(
      `UPDATE users
         SET full_name = ?, email = ?
         WHERE counselor_id = ?`,
      [full_name, email, id]
    );

    res.json({ message: 'Counselor updated successfully' });
  } catch (err) {
    console.error('Update Counselor error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteCounselor = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM counselors WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Counselor not found' });
    }
    const [userResult] = await db.query('DELETE FROM users WHERE counselor_id = ?', [id]);

    res.json({ message: 'Counselor deleted successfully' });
  } catch (err) {
    console.error('Delete Counselor error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllCounselor = async (_, res) => {
  try {
    const [rows] = await db.query(
      `
          SELECT 
            c.*, 
            u.email, u.full_name, u.role 
          FROM counselors c 
          JOIN users u ON c.id = u.counselor_id
          `
    );

    // If no counselors found
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No counselors found' });
    }

    // Get university names in parallel
    const counselorsWithUniversity = await Promise.all(
      rows.map(async (counselor) => {
        const university_name = await universityNameById(counselor.university_id);
        return {
          id: counselor.id,
          user_id: counselor.user_id,
          email: counselor.email,
          phone: counselor.phone,
          university: university_name[0]?.name,
          status: counselor.status,
          full_name: counselor.full_name,
          role: counselor.role,
          created_at: counselor.created_at,
          updated_at: counselor.updated_at
        };
      })
    );

    res.status(200).json(counselorsWithUniversity);
  } catch (err) {
    console.error('Get All Counselors error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const creategettesting = async (req, res) => {
  try {
    const {
      name, email, password, phone
    } = req.body;
    const [result] = await db.query(
      `INSERT INTO testing (name, email, password, phone)
       VALUES (?, ?, ?, ?)`,
      [name, email, password, phone]
    );
    res.status(201).json({
      message: 'Task created successfully',
      taskId: result.insertId
    });
  } catch (err) {
    console.error('Create Task Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const gettesting = async (req, res) => {
  try {
    const [result] = await db.query(`SELECT * FROM testing`);
    res.status(201).json({
      message: 'result fetch successfully',
      data: result
    });
  }
  catch {
    console.error('Create Task Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}



