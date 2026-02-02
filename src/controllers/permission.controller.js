import db from '../config/db.js';


export const createPermission = async (req, res) => {
    const { role_name, permission_name, view_permission, add_permission, edit_permission, delete_permission, user_id } = req.body;
    if (!role_name || !permission_name || user_id === undefined) {
      return res.status(400).json({ message: 'Required fields missing' });
    }
    try {
      const [result] = await db.query(
        `INSERT INTO permissions (role_name, permission_name, view_permission, add_permission, edit_permission, delete_permission, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [role_name, permission_name, view_permission, add_permission, edit_permission, delete_permission, user_id]
      );
      res.status(201).json({ message: 'Permission created', id: result.insertId });
    } catch (err) {
      console.error('Error creating permission:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

export const getPermissions = async (req, res) => {
    const {role_name} = req.query;
  try {
    const [rows] = await db.query('SELECT * FROM permissions WHERE role_name = ?',role_name);
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching permissions:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPermissionById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM permissions WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Permission not found' });
    }
    res.status(200).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updatePermission = async (req, res) => {
  const { role_name, permission_name, view_permission, add_permission, edit_permission, delete_permission, user_id } = req.body;

  try {
    const [result] = await db.query(
      `UPDATE permissions SET role_name=?, permission_name=?, view_permission=?, add_permission=?, edit_permission=?, delete_permission=?, user_id=? WHERE id=?`,
      [role_name, permission_name, view_permission, add_permission, edit_permission, delete_permission, user_id, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    res.status(200).json({ message: 'Permission updated' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deletePermission = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM permissions WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Permission not found' });
    }
    res.status(200).json({ message: 'Permission deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updatePermissionStatus =  async (req, res) => {
    try {
        const { id } = req.params;
        const updates = [];
        const values = [];

        if ("view_permission" in req.body) {
            updates.push("`view_permission` = ?");
            values.push(req.body.view_permission);
        }
        if ("add_permission" in req.body) {
            updates.push("`add_permission` = ?");
            values.push(req.body.add_permission);
        }
        if ("edit_permission" in req.body) {
            updates.push("`edit_permission` = ?");
            values.push(req.body.edit_permission);
        }
        if ("delete_permission" in req.body) {
            updates.push("`delete_permission` = ?");
            values.push(req.body.delete_permission);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ message: "No valid fields provided for update" });
        }

        values.push(id); // ID ko values list ke last mein add kar rahe hain
        const query = `UPDATE permissions SET ${updates.join(", ")} WHERE id = ?`;

        const [result] = await db.query(query, values);

        if (result.affectedRows > 0) {
            return res.status(200).json({ message: "User's permissions updated successfully", result });
        } else {
            return res.status(404).json({ message: "User not found or no change made" });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
