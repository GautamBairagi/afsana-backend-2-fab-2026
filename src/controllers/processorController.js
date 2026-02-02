import db from '../config/db.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

export const createProcessor = async (req, res) => {
  const { full_name, email, phone, password, role  } = req.body;
  try {
    if (!full_name || !email || !phone || !password || !role) {
      return res.status(400).json({ message: 'All required fields must be filled' });
    }
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Processor already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      `INSERT INTO users (full_name, email, phone, password, role, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [full_name, email, phone, hashedPassword, role]
    );
    res.status(201).json({ message: 'Processor created successfully' });
  } catch (err) {
    console.error('Create Processor Error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

export const getAllProcessors = async (req, res) => {
  try {
    const [processors] = await db.query('SELECT * FROM users WHERE role = ?', ['processors']);
    res.status(200).json(processors);
  } catch (err) {
    console.error('Get All Processors Error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};


export const getProcessorById = async (req, res) => {
  const { id } = req.params;
  try {
    const [processor] = await db.query('SELECT * FROM users WHERE id = ? AND role = ?', [id, 'processors']);
    if (processor.length === 0) {
      return res.status(404).json({ message: 'Processor not found' });
    }
    res.status(200).json(processor[0]);
  } catch (err) {
    console.error('Get Processor Error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};



export const updateProcessor = async (req, res) => {
  const { id } = req.params;
  const { full_name, email, phone } = req.body;
  try {
    const [existing] = await db.query('SELECT id FROM users WHERE id = ? AND role = ?', [id, 'processor']);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Processor not found' });
    }
    await db.query(
      `UPDATE users SET full_name = ?, email = ?, phone = ?WHERE id = ? AND role = ?`,
      [full_name, email, phone, id, 'processors']
    );
    res.status(200).json({ message: 'Processor updated successfully' });
  } catch (err) {
    console.error('Update Processor Error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};


  

export const deleteProcessor = async (req, res) => {
  const { id } = req.params;
  try {
    const [existing] = await db.query('SELECT id FROM users WHERE id = ? AND role = ?', [id, 'processors']);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Processor not found' });
    }
    await db.query('DELETE FROM users WHERE id = ? AND role = ?', [id, 'processors']);
    res.status(200).json({ message: 'Processor deleted successfully' });
  } catch (err) {
    console.error('Delete Processor Error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};


