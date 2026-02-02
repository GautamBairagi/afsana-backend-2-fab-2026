import db from '../config/db.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

// ✅ Create Admin
export const createAdmin = async (req, res) => {
  const { full_name, email, phone, password } = req.body;

  try {
    if (!full_name || !email || !phone || !password) {
      return res.status(400).json({ message: 'All required fields must be filled' });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Admin already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      `INSERT INTO users (full_name, email, phone, password, role, created_at)
       VALUES (?, ?, ?, ?, 'admin', NOW())`,
      [full_name, email, phone, hashedPassword]
    );

    res.status(201).json({ message: 'Admin created successfully' });
  } catch (err) {
    console.error('Create Admin Error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

// ✅ Get All Admins
export const getAllAdmins = async (req, res) => {
  try {
    const [admins] = await db.query('SELECT * FROM users WHERE role = ?', ['admin']);
    res.status(200).json(admins);
  } catch (err) {
    console.error('Get All Admins Error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

// ✅ Get Admin by ID
export const getAdminById = async (req, res) => {
  const { id } = req.params;

  try {
    const [admin] = await db.query('SELECT * FROM users WHERE id = ? AND role = ?', [id, 'admin']);
    if (admin.length === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.status(200).json(admin[0]);
  } catch (err) {
    console.error('Get Admin Error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};





// AllAdminsdashbaord

// ✅ Update Admin
export const updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { full_name, email, phone } = req.body;

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE id = ? AND role = ?', [id, 'admin']);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    await db.query(
      `UPDATE users SET full_name = ?, email = ?, phone = ? WHERE id = ? AND role = ?`,
      [full_name, email, phone, id, 'admin']
    );

    res.status(200).json({ message: 'Admin updated successfully' });
  } catch (err) {
    console.error('Update Admin Error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

// ✅ Delete Admin
export const deleteAdmin = async (req, res) => {
  const { id } = req.params;

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE id = ? AND role = ?', [id, 'admin']);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    await db.query('DELETE FROM users WHERE id = ? AND role = ?', [id, 'admin']);
    res.status(200).json({ message: 'Admin deleted successfully' });
  } catch (err) {
    console.error('Delete Admin Error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};
