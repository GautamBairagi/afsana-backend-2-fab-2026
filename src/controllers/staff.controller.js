import db from '../config/db.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();


  //  export const createStaff = async (req, res) => {
  //   console.log("req.body : ", req.body);

  //   const {
  //     user_id,
  //     full_name,
  //     email,
  //     phone,
  //     password,
  //     role,
  //     status
  //   } = req.body;
  
  //   try {
     
  //     if (!full_name || !email || !phone || !password || !role) {
  //       return res.status(400).json({ message: 'All required fields must be filled' });
  //     }
  
     
  //     const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  //     if (existing.length > 0) {
  //       return res.status(409).json({ message: 'Staff already exists' });
  //     }
  //     const hashed = await bcrypt.hash(password, 10);
  //     const [counselorResult] = await db.query(
  //       `INSERT INTO staff (user_id,  phone, status)
  //        VALUES (?, ?, ?)`,
  //       [user_id, phone, status]
  //     );
  
  //     if (!counselorResult.affectedRows) {
  //       return res.status(400).json({ message: 'Staff not added properly' });
  //     }
  
  //     const staffID = counselorResult.insertId;
  
    
  //     const [userResult] = await db.query(
  //       'INSERT INTO users (email, password, full_name, role, user_id, staff_id) VALUES (?, ?, ?, ?, ?, ?)',
  //       [email, hashed, full_name, role, user_id, staffID]
  //     );
  
  //     if (!userResult.insertId) {
  //       return res.status(400).json({ message: 'Staff creation failed' });
  //     }
  
  //     res.status(201).json({ message: 'Staff created successfully' });
  
  //   } catch (err) {
  //     console.error('Create Staff error:', err);
  //     res.status(500).json({ message: 'Internal server error', error: err.message });
  //   }
  // };


//   export const createStaff = async (req, res) => {
//   console.log("req.body : ", req.body);

//   const {
//     user_id,
//     full_name,
//     email,
//     phone,
//     password,
//     role,
//     status,
//     permissions // ये array आएगा: [{ permission_name, view_permission, add_permission, edit_permission, delete_permission }]
//   } = req.body;

//   try {
//     if (!full_name || !email || !phone || !password || !role) {
//       return res.status(400).json({ message: 'All required fields must be filled' });
//     }

//     const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
//     if (existing.length > 0) {
//       return res.status(409).json({ message: 'Staff already exists' });
//     }

//     const hashed = await bcrypt.hash(password, 10);

//     const [staffResult] = await db.query(
//       `INSERT INTO staff (user_id, phone, status) VALUES (?, ?, ?)`,
//       [user_id, phone, status]
//     );

//     if (!staffResult.affectedRows) {
//       return res.status(400).json({ message: 'Staff not added properly' });
//     }

//     const staffID = staffResult.insertId;

//     const [userResult] = await db.query(
//       'INSERT INTO users (email, password, full_name, role, user_id, staff_id) VALUES (?, ?, ?, ?, ?, ?)',
//       [email, hashed, full_name, role, user_id, staffID]
//     );

//     const insertedUserID = userResult.insertId;

//     // 👇 Permission assign (if permissions are provided)
//     if (Array.isArray(permissions) && permissions.length > 0) {
//       const permissionQueries = permissions.map(p =>
//         db.query(
//           `INSERT INTO permissions (role_name, permission_name, view_permission, add_permission, edit_permission, delete_permission, user_id) 
//            VALUES (?, ?, ?, ?, ?, ?, ?)`,
//           [role, p.permission_name, p.view_permission, p.add_permission, p.edit_permission, p.delete_permission, insertedUserID]
//         )
//       );
//       await Promise.all(permissionQueries);
//     }

//     res.status(201).json({ message: 'Staff created successfully with permissions' });

//   } catch (err) {
//     console.error('Create Staff error:', err);
//     res.status(500).json({ message: 'Internal server error', error: err.message });
//   }
// };



export const createStaff = async (req, res) => {
  console.log("req.body : ", req.body);

  const {
    user_id,
    full_name,
    email,
    phone,
    password,
    role,
    status,
    permissions,
    branch 
  } = req.body;

  try {
    if (!full_name || !email || !phone || !password || !role) {
      return res.status(400).json({ message: 'All required fields must be filled' });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Staff already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const [staffResult] = await db.query(
      `INSERT INTO staff (user_id, phone, status, branch) VALUES (?, ?, ?, ?)`,
      [user_id, phone, status, branch]
    );

    if (!staffResult.affectedRows) {
      return res.status(400).json({ message: 'Staff not added properly' });
    }

    const staffID = staffResult.insertId;

    const [userResult] = await db.query(
      `INSERT INTO users (email, password, full_name, role, user_id, staff_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [email, hashed, full_name, role, user_id, staffID]
    );

    const insertedUserID = userResult.insertId;

    // 👇 Assign permission if provided
    if (Array.isArray(permissions) && permissions.length > 0) {
      const permissionQueries = permissions.map(p =>
        db.query(
          `INSERT INTO permissions 
            (role_name, permission_name, view_permission, add_permission, edit_permission, delete_permission, user_id) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [role, p.permission_name, p.view_permission, p.add_permission, p.edit_permission, p.delete_permission, insertedUserID]
        )
      );
      await Promise.all(permissionQueries);
    }

    res.status(201).json({ message: 'Staff created successfully with permissions' });

  } catch (err) {
    console.error('Create Staff error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};



// await axios.post('/api/staff/create', {
//   user_id: 1,
//   full_name: "Ramesh Sharma",
//   email: "ramesh@example.com",
//   phone: "1234567890",
//   password: "secret123",
//   role: "staff",
//   status: "active",
//   permissions: [
//     {
//       permission_name: "Dashboard",
//       view_permission: 1,
//       add_permission: 1,
//       edit_permission: 1,
//       delete_permission: 0
//     },
//     {
//       permission_name: "Leads",
//       view_permission: 1,
//       add_permission: 1,
//       edit_permission: 1,
//       delete_permission: 1
//     }
//   ]
// });




// export const assignOrUpdatePermission = async (req, res) => {
//   const { user_id, role_name, permission_name, view_permission, add_permission, edit_permission, delete_permission } = req.body;

//   if (!user_id || !role_name || !permission_name) {
//     return res.status(400).json({ message: "Required fields missing" });
//   }

//   try {
//     const [existing] = await db.query(
//       `SELECT id FROM permissions WHERE user_id = ? AND permission_name = ?`,
//       [user_id, permission_name]
//     );

//     if (existing.length > 0) {
//       // Update existing permission
//       await db.query(
//         `UPDATE permissions SET view_permission=?, add_permission=?, edit_permission=?, delete_permission=? WHERE id=?`,
//         [view_permission, add_permission, edit_permission, delete_permission, existing[0].id]
//       );
//     } else {
//       // Create new permission
//       await db.query(
//         `INSERT INTO permissions (user_id, role_name, permission_name, view_permission, add_permission, edit_permission, delete_permission)
//          VALUES (?, ?, ?, ?, ?, ?, ?)`,
//         [user_id, role_name, permission_name, view_permission, add_permission, edit_permission, delete_permission]
//       );
//     }

//     res.status(200).json({ message: "Permission assigned/updated successfully" });
//   } catch (error) {
//     console.error("Permission Error:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };




export const assignOrUpdatePermission = async (req, res) => { 
  const {
    user_id,
    role_name,
    permission_name,
    view_permission,
    add_permission,
    edit_permission,
    delete_permission
  } = req.body;

  if (!user_id || !role_name || !permission_name) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  try {
    const [existing] = await db.query(
      `SELECT id FROM permissions WHERE user_id = ? AND permission_name = ?`,
      [user_id, permission_name]
    );

    if (existing.length > 0) {
      // Update existing permission
      await db.query(
        `UPDATE permissions 
         SET view_permission = ?, add_permission = ?, edit_permission = ?, delete_permission = ? 
         WHERE id = ?`,
        [view_permission, add_permission, edit_permission, delete_permission, existing[0].id]
      );
    } else {
      // Insert new permission
      await db.query(
        `INSERT INTO permissions 
         (user_id, role_name, permission_name, view_permission, add_permission, edit_permission, delete_permission)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user_id, role_name, permission_name, view_permission, add_permission, edit_permission, delete_permission]
      );
    }

    res.status(200).json({ message: "Permission assigned/updated successfully" });

  } catch (error) {
    console.error("Permission Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const getPermissionsByUser = async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ message: 'user_id is required' });
  }

  try {
    const [rows] = await db.query(
      `SELECT * FROM permissions WHERE user_id = ?`,
      [user_id]
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching permissions by user:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

    export const getStaffById = async (req, res) => {
    const { id } = req.params;
  
    try {
      const [rows] = await db.query(
        `
        SELECT 
          c.*, 
          u.email, u.full_name, u.role 
        FROM staff c 
        JOIN users u ON c.id = u.staff_id
        WHERE u.id = ?
        `,
        [id]
      );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No staff found' });
    }
    res.status(200).json(rows);
    } catch (err) {
      console.error('Get staff error:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
  
  export const updateStaff = async (req, res) => {
    const { id } = req.params;
    const {
      user_id,
      full_name,
      email,
      phone,
      status,
      branch
    } = req.body;
    try {
      const [result] = await db.query(
        `UPDATE staff  
         SET user_id = ?,  phone = ?,  status = ?, branch = ?
         WHERE id = ?`,
        [user_id,  phone, status, branch,  id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'staff not found' });
      }
      const [userResult] = await db.query(
        `UPDATE users
         SET full_name = ?, email = ?
         WHERE staff_id = ?`,
        [full_name, email, id]
      );

      res.json({ message: 'staff updated successfully' });
    } catch (err) {
      console.error('Update staff error:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
export const deleteStaff = async (req, res) => {
  const { id } = req.params;
  try {
    // First, delete from users table where staff_id = id
    const [userResult] = await db.query('DELETE FROM users WHERE staff_id = ?', [id]);

    // Then, delete the staff record
    const [result] = await db.query('DELETE FROM staff WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    res.json({ message: 'Staff deleted successfully' });
  } catch (err) {
    console.error('Delete staff error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

 

export const getAllStaff = async (_, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT 
        s.*, 
        u.email, 
        u.full_name, 
        u.role 
      FROM staff s 
      JOIN users u ON s.id = u.staff_id
      `
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No staff found' });
    }

    res.status(200).json(rows);
  } catch (err) {
    console.error('Get All Staff error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};



// Get all staff (optionally filtered by branch)
// export const getAllStaffbybranch = async (req, res) => {
//   try {
//     const { branch } = req.query; // read query param

//     let query = "SELECT * FROM staff";
//     let params = [];

//     // If branch filter is provided, add WHERE clause
//     if (branch && branch.trim() !== "") {
//       query += " WHERE branch = ?";
//       params.push(branch);
//     }

//     const [rows] = await db.query(query, params);

//     if (rows.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "No staff found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       count: rows.length,
//       data: rows,
//     });
//   } catch (error) {
//     console.error("Error fetching staff:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };


export const getAllStaffbybranch = async (req, res) => {
  try {
    const { branch } = req.query;
    console.log("🔍 Incoming branch filter:", branch);

    // ✅ Base query with JOIN (staff + users)
    let query = `
      SELECT 
        s.id AS staff_id,
        s.user_id,
        s.branch,
        s.status,
        s.phone,
        s.created_at,
        s.updated_at,
        u.id AS user_table_id,
        u.full_name,
        u.email,
        u.role
      FROM staff s
      LEFT JOIN users u ON s.id = u.staff_id
    `;

    const params = [];

    // ✅ Optional branch filter
    if (branch && branch.trim() !== "") {
      query += " WHERE LOWER(s.branch) = LOWER(?)";
      params.push(branch.trim());
    }

    console.log("📜 Final Query:", query, params);

    const [rows] = await db.query(query, params);

    // ✅ If no records
    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No staff found for the given branch.",
      });
    }

    // ✅ Success response
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });

  } catch (error) {
    console.error("❌ Error fetching staff by branch:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching staff data.",
      error: error.message,
    });
  }
};


   
  

 