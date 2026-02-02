import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import dotenv from 'dotenv';
import { getCounselorById } from '../models/counselor.model.js';
import { universityNameById } from '../models/universities.model.js';
dotenv.config();
import nodemailer from "nodemailer";
import crypto from 'crypto';


import admin from '../config/firebase.js';







export const register = async (req, res) => {
  const { email, password, full_name, role } = req.body;

  if (!email || !password || !full_name || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  try {
    // Check if user already exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const userdata = await db.query(
      'INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)',
      [email, hashed, full_name, role]
    );
    console.log("userdata : ", userdata);
    const userId = userdata[0].insertId;
    await db.query(
      'INSERT INTO students (user_id) VALUES (?)',
      [userId]
    );
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Internal server error', err, errmsg: err.message });
  }
};



// commentg

export const login = async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body);


  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const [results] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    console.log("match password : ", results);
    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    const token = jwt.sign({ id: user.id, role: user.role }, "dfsdfdsfdsg34345464543sdffdg#%$", { expiresIn: '7d' });
    // const token = jwt.sign({ id: user.id, role: user.role },process.env.JWT_SECRET, { expiresIn: '12h' }
    // );

    if (!match) {
      return res.status(401).json({ message: 'password credentials not match!' });
    }

    let permission = [];
    if (user.role === 'student' || user.role === 'counselor') {
      const [rows] = await db.query('SELECT * FROM permissions WHERE role_name = ?', [user.role]);
      permission = rows;
    }
    let maindetails = [];
    if (user.role == 'student') {
      const [details] = await db.query('SELECT * FROM students WHERE id = ?', [user.student_id]);
      maindetails = details;

      return res.json({
        token,
        user: {
          // phone : maindetails[0].phone,
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          student_id: user.student_id,
          staff_id: results.staff_id,
          // father_name : maindetails[0].father_name,
          // admission_no : maindetails[0].admission_no, 

          // phone : maindetails[0].mobile_number,
          // university_id : maindetails[0].university_id,
          // date_of_birth : maindetails[0].date_of_birth,
          // gender : maindetails[0].gender,
          // category : maindetails[0].category,
          // address : maindetails[0].address,
          // photo : maindetails[0].photo ? `${req.protocol}://${req.get('host')}${maindetails[0].photo}` : null,
          // documents : maindetails[0].documents,
          // created_at : maindetails[0].created_at
        },
        permissions: permission
      });

    }
    if (user.role == 'counselor') {
      const [details] = await db.query('SELECT * FROM counselors WHERE id = ?', [user.counselor_id]);
      maindetails = details;
      console.log("maindetails[0]?.university_id : ", maindetails[0]?.university_id);
      const data = await universityNameById(maindetails[0]?.university_id);
      console.log("data : ", data);
      return res.json({
        token,
        user: {
          phone: maindetails[0].phone,
          status: maindetails[0].status,
          university_name: data[0].name,
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          counselor_id: user.counselor_id,
        },
        permissions: permission
      });
    }
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        address: user.address,
        phone: user.phone,
        staff_id: user.staff_id,

      },
      permissions: permission
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error', err, errmsg: err.message });
  }
};







// Check Token Validity


export const validateToken = (req, res) => {
  const authHeader = req.headers.authorization;

  // Check if token exists and starts with 'Bearer '
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false, message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify the token using secret from .env

    const decoded = jwt.verify(token, "dfsdfdsfdsg34345464543sdffdg#%$");

    // const decoded = jwt.verify(token, 'dfsdfdsfdsg34345464543sdffdg#%$');

    return res.status(200).json({
      valid: true,
      user: decoded, // id, role, etc.
    });
  } catch (err) {
    console.error('JWT Error:', err.message); // Log the actual error for debug
    return res.status(401).json({
      valid: false,
      message: 'Token expired or invalid',
    });
  }
};

export const checkPermission = (permissionName, action) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id; // Make sure req.user is set from JWT

      // Validate input
      if (!permissionName || !action) {
        return res.status(400).json({ message: "Permission check configuration error" });
      }

      // Fetch permissions for the user
      const [permissions] = await db.query(`
        SELECT p.* FROM user_permissions up
        JOIN permission p ON p.permission_name = up.permission_name
        WHERE up.user_id = ?
      `, [userId]);

      // Check if required permission exists and action (view/add/edit/delete) is allowed
      const hasPermission = permissions.some(p =>
        p.permission_name === permissionName && p[`${action}_permission`] === 1
      );

      if (!hasPermission) {
        return res.status(403).json({ message: "Access Denied: No Permission" });
      }

      // Permission granted
      next();

    } catch (error) {
      console.error("Permission check failed:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };
};

export const getuserById = async (req, res) => {
  const { id } = req.params;
  // console.log("id : ", id);

  try {
    const [results] = await db.query('SELECT * FROM users WHERE id = ?', [id]);

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = results[0];

    if (user.role === 'student') {
      const [studentDetails] = await db.query('SELECT * FROM students WHERE id = ?', [user.student_id]);

      if (studentDetails.length === 0) {
        return res.status(404).json({ message: 'Student not found' });
      }
      const student = studentDetails[0];
      return res.json({
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          student_id: user.student_id,
          father_name: student.father_name,

          identifying_name: student.identifying_name,
          mother_name: student.mother_name,
          phone: student.mobile_number,
          university_id: student.university_id,
          date_of_birth: student.date_of_birth,
          gender: student.gender,
          category: student.category,
          address: student.address,
          photo: student.photo ? `${req.protocol}://${req.get('host')}${student.photo}` : null,
          documents: student.documents,
          created_at: student.created_at
        }
      });
    }

    if (user.role === 'counselor') {
      const [counselorDetails] = await db.query('SELECT * FROM counselors WHERE id = ?', [user.counselor_id]);

      if (counselorDetails.length === 0) {
        return res.status(404).json({ message: 'Counselor not found' });
      }

      const counselor = counselorDetails[0];

      let universityName = null;
      if (counselor.university_id) {
        try {
          const universityData = await universityNameById(counselor.university_id);
          universityName = universityData.length ? universityData[0].name : null;
        } catch (err) {
          console.error('Error fetching university name:', err);
        }
      }

      return res.json({
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          counselor_id: user.counselor_id,
          phone: counselor.phone,
          status: counselor.status,
          university_name: universityName
        }
      });
    }

    // General User (e.g., Admin)
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        address: user.address,
        phone: user.phone
      }
    });

  } catch (err) {
    console.error('Error in getuserById:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const createStudent = async (req, res) => {
  console.log("req.body:", req.body);
  console.log("req.files:", req.files);
  try {
    const {
      father_name,
unique_id,
country,
      mobile_number,
      university_id,
      date_of_birth,
      gender,
      category,
      address,
      full_name,
      password,
      email,
      identifying_name,
      mother_name
    } = req.body;
    // ✅ Check for required fields
    if (!full_name || !email || !password) {
      return res.status(400).json({ message: 'full_name, email, and password are required' });
    }
    const role = 'student';
    // ✅ Handle optional file uploads
    const photo = req.files?.photo?.[0]
      ? `/uploads/${req.files.photo[0].filename}`
      : '';
    const documents = req.files?.documents?.[0]
      ? `/uploads/${req.files.documents[0].filename}`
      : '';
    // ✅ Email uniqueness check
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'User already exists' });
    }
    // ✅ Password hashing
    const hashed = await bcrypt.hash(password, 10);
    // ✅ Handle optional fields with null values for optional fields
    const parsedUniversityId =
      university_id && !isNaN(university_id) ? Number(university_id) : null;
    // ✅ Insert into users table first (since user_id is created there)
    const [userResult] = await db.query(
      'INSERT INTO users (email, password, full_name, user_id, role) VALUES (?, ?, ?, ?, ?)',
      [email, hashed, full_name, 0, role]
    );
    const userId = userResult.insertId;
    // ✅ Insert into students table with the `user_id` created in the `users` table
    const [studentResult] = await db.query(
      `INSERT INTO students 
        (user_id, father_name, unique_id, country ,  identifying_name, mother_name,  mobile_number, university_id, date_of_birth, gender, category, address, full_name, role, photo, documents) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        father_name || '',
unique_id || '',
country || '',
        identifying_name || '',
        mother_name || '',
        mobile_number || '',
        parsedUniversityId,
        date_of_birth || null,
        gender || '',
        category || '',
        address || '',
        full_name,
        role,
        photo,
        documents,
      ]
    );
    const studentId = studentResult.insertId;
    // ✅ After inserting the student, update `users` table with the `student_id`
    await db.query('UPDATE users SET student_id = ? WHERE id = ?', [studentId, userId]);

    res.status(201).json({ message: 'Student created successfully' });

  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
};

const OTPStore = new Map(); // temporary (in-memory); use Redis or DB in production

export const sendOtpToEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ status: "false", message: "Email is required" });
  }

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    OTPStore.set(email, otp); // store OTP temporarily

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"Your App" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Signup OTP Verification",
      html: `<h3>Your OTP is: <b>${otp}</b></h3><p>Valid for 10 minutes.</p>`
    });

    return res.status(200).json({ status: "true", message: "OTP sent to email" });

  } catch (error) {
    console.error("Send OTP Error:", error);
    return res.status(500).json({ status: "false", message: "Failed to send OTP", error: error.message });
  }
};

export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ status: "false", message: "Email and OTP required" });
  }

  const storedOtp = OTPStore.get(email);
  if (storedOtp === otp) {
    OTPStore.delete(email);
    return res.status(200).json({ status: "true", message: "OTP verified" });
  } else {
    return res.status(400).json({ status: "false", message: "Invalid or expired OTP" });
  }
};

export const signupWithGoogle = async (req, res) => {
  const { email, googleSignIn } = req.body;
  console.log(req.body);

  try {
    if (!email) {
      return res.status(400).json({
        status: "false",
        message: "Email is required",
        data: []
      });
    }

    const [existingUser] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

    let user;

    if (existingUser.length > 0) {
      user = existingUser[0];
      if (!user.googleSignIn && googleSignIn) {
        await db.execute('UPDATE users SET googleSignIn = ? WHERE email = ?', [true, email]);
        user.googleSignIn = true;
      }
    } else {
      const [insertResult] = await db.execute(
        'INSERT INTO users (email, googleSignIn) VALUES (?, ?)',
        [email, googleSignIn || true]
      );

      const userId = insertResult.insertId;

      const [newUser] = await db.execute(
        'SELECT id, email, password, googleSignIn FROM users WHERE id = ?',
        [userId]
      );

      user = newUser[0];
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      "dfsdfdsfdsg34345464543sdffdg#%$",
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      status: "true",
      message: existingUser.length > 0
        ? "Google login successful"
        : "Google signup successful",
      data: {
        ...user,
        token
      }
    });

  } catch (error) {
    console.error("Google Sign-Up Error:", error);
    return res.status(500).json({
      status: "false",
      message: "Server error",
      error: error.message
    });
  }
};

export const createStudentWithGoogle = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Google token is required" });
    }

    // 🔍 Step 1: Verify Google token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const googleUser = await admin.auth().getUser(decodedToken.uid);
    const email = googleUser.email;
    const full_name = googleUser.displayName || "";
    const role = "student";

    // 🔍 Step 2: Check if user already exists
    const [existing] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    if (existing.length > 0) {
      const token = jwt.sign(
        { id: existing[0].id, email: existing[0].email, role: existing[0].role },
        "dfsdfdsfdsg34345464543sdffdg#%$",
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        message: "User already registered. Please log in.",
        user: existing[0],
        token,
        status: "existing",
      });
    }

    // 🧩 Step 3: Insert into users table
    const [userResult] = await db.query(
      "INSERT INTO users (email, full_name, role, user_id) VALUES (?, ?, ?, ?)",
      [email, full_name, role, 0]
    );
    const userId = userResult.insertId;

    // 🧩 Step 4: Insert into students table
    const [studentResult] = await db.query(
      `INSERT INTO students 
        (user_id, full_name, role) 
        VALUES (?, ?, ?)`,
      [userId, full_name, role]
    );
    const studentId = studentResult.insertId;

    // 🧩 Step 5: Update users table with student_id
    await db.query("UPDATE users SET student_id = ? WHERE id = ?", [studentId, userId]);

    // 🧩 Step 6: Generate JWT
    const jwtToken = jwt.sign(
      { id: userId, email, role },
      "dfsdfdsfdsg34345464543sdffdg#%$",
      { expiresIn: "7d" }
    );

    // ✅ Done


    res.status(201).json({
      message: "Student registered via Google Sign-In",
      user: {
        id: userId,
        student_id: studentId, // 👈 Add this line
        email,
        full_name,
        role
      },
      token: jwtToken,
      status: "registered",
    });



  } catch (error) {
    console.error("Google Sign-Up Error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


export const StudentAssignToCounselor = async (req, res) => {
  try {
    const { student_id, counselor_id, follow_up, notes } = req.body;

    // Validate required field
    if (!student_id) {
      return res.status(400).json({ message: "'student_id' is required" });
    }

    // Build dynamic update parts
    const updates = [];
    const values = [];

    if (counselor_id !== undefined) {
      updates.push("counselor_id = ?");
      values.push(counselor_id);
    }
    if (follow_up !== undefined) {
      updates.push("follow_up = ?");
      values.push(follow_up);
    }
    if (notes !== undefined) {
      updates.push("notes = ?");
      values.push(notes);
    }
    if (updates.length === 0) {
      return res.status(400).json({ message: "No fields provided to update" });
    }
    // Always update updated_at
    updates.push("updated_at = NOW()");
    // Final SQL query
    const sql = `UPDATE students SET ${updates.join(", ")} WHERE id = ?`;
    values.push(student_id);
    // Execute update
    const [result] = await db.query(sql, values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Student ID not found" });
    }
    if (result) {
      const [findCounselorName] = await db.query(
        "SELECT full_name FROM users WHERE counselor_id = ?",
        [counselor_id]
      );
      const [findStudnetName] = await db.query(
        "SELECT full_name FROM users WHERE student_id = ?",
        [student_id]
      );

      const Cname = findCounselorName[0]?.full_name;
      const Sname = findStudnetName[0]?.full_name;
      await db.query(
        `INSERT INTO dashboard_notifications 
                 (counselor_id, student_id, sNotification, cNotification, message)
                 VALUES (?, ?, ?, ?, ?)`,
        [counselor_id, student_id, 1, 1, `Studnet ${Sname} assigned to counselor ${Cname}`]
      );

    }
    // Optionally return updated data
    const [updatedStudent] = await db.query("SELECT * FROM students WHERE id = ?", [student_id]);
    res.status(200).json({
      message: "Student updated successfully",
      data: updatedStudent[0],
    });

  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({
      message: "Update failed",
      error: error.message,
    });
  }
};


export const getStudentsByCounselorId = async (req, res) => {
  const { counselorId } = req.params;
  try {
    const [students] = await db.query(
      `SELECT
        s.*,
        u.email,
        u.full_name AS user_full_name,
        u.role AS user_role,
        uni.name AS university_name
      FROM students s
      JOIN users u ON s.id = u.student_id
      LEFT JOIN universities uni ON s.university_id = uni.id
      WHERE s.counselor_id = ?`,
      [counselorId]
    );
    res.status(200).json(students);
  } catch (error) {
    console.error("Error fetching students by counselor ID:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};






// export const getAssignedStudentsincounserdashboard = async (req, res) => {
//   const { counselor_id } = req.query;

//   try {
//     const [students] = await db.query(
//       `SELECT *  FROM students WHERE counselor_id = ?`,
//       [counselor_id]
//     );


//     res.json({
//       users: [...students],
//     });
//   } catch (error) {
//     console.error("Error fetching assigned students:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };


export const getAssignedStudentsincounserdashboard = async (req, res) => {
  const { counselor_id } = req.query;

  try {
    const [students] = await db.query(
      `
      SELECT 
        s.*, 
        u.name AS university_name
      FROM students s
      LEFT JOIN universities u 
        ON s.university_id = u.id
      WHERE s.counselor_id = ?
      `,
      [counselor_id]
    );

    res.json({
      users: students,
    });
  } catch (error) {
    console.error("Error fetching assigned students:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};







export const getAssignedStudentsinProcessordashboard = async (req, res) => {
  const { processor_id } = req.query;

  try {
  const [students] = await db.query(
      `
      SELECT 
        s.*, 
        u.email AS student_email,
        univ.name AS university_name
      FROM students s
      LEFT JOIN users u ON u.student_id = s.id     -- user email
      LEFT JOIN universities univ ON univ.id = s.university_id  -- university name
      WHERE s.processor_id = ?
      `,
      [processor_id]
    );


    res.json({
      users: [...students],
    });
  } catch (error) {
    console.error("Error fetching assigned students:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};






export const getAssignedStudents = async (req, res) => {
  const { counselor_id } = req.params; // Assuming auth middleware sets req.user

  try {
    const [students] = await db.query(
      `SELECT 
         u.full_name,
         u.role,
         s.id AS student_id,
         u.id
       FROM students s
       JOIN users u ON s.id = u.student_id
       WHERE s.counselor_id = ?`,
      [counselor_id]
    );

    res.status(200).json(students);
  } catch (error) {
    console.error("Error fetching assigned students:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const getAllStudents = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        s.*,
        u.email,
        u.full_name,
        u.role,
        uni.name AS university_name
      FROM students s
      JOIN users u
        ON s.id = u.student_id
      LEFT JOIN universities uni
        ON s.university_id = uni.id
    `);
    const parsedRows = rows.map(row => ({
      ...row,
      photo: row.photo
        ? `${req.protocol}://${req.get("host")}${row.photo}`
        : null,
      documents: row.documents
        ? `${req.protocol}://${req.get("host")}${row.documents}`
        : null,
    }));


    const result = await Promise.all(
      rows.map(async (decision) => {
        const counselorDetails = await getCounselorById(decision?.counselor_id);
        return {
          ...decision,
          counselorName: counselorDetails[0]?.full_name || "Not Assigned",
        };
      })
    );
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const updateStudent = async (req, res) => {
  const studentId = req.params.id;

  console.log("req.body:", req.body);
  console.log("req.files:", req.files);

  try {
    const {
      father_name,
      mother_name,
      identifying_name,
      mobile_number,
      university_id,
      date_of_birth,
      gender,
      category,
      address,
      full_name,
      email,
      country,
      
      password // optional update
    } = req.body;

    if (!full_name || !email) {
      return res.status(400).json({ message: 'full_name and email are required' });
    }

    // ✅ Fetch user_id from student_id
    const [studentRows] = await db.query('SELECT user_id FROM students WHERE id = ?', [studentId]);
    if (studentRows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    const userId = studentRows[0].user_id;

    // ✅ Handle file uploads
    const photo = req.files?.photo?.[0]
      ? `/uploads/${req.files.photo[0].filename}`
      : null;

    const documents = req.files?.documents?.[0]
      ? `/uploads/${req.files.documents[0].filename}`
      : null;

    const parsedUniversityId =
      university_id && !isNaN(university_id) ? Number(university_id) : null;

    // ✅ Update users table
    const userUpdateFields = ['email = ?', 'full_name = ?'];
    const userUpdateValues = [email, full_name];

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      userUpdateFields.push('password = ?');
      userUpdateValues.push(hashed);
    }

    userUpdateValues.push(userId);
    await db.query(`UPDATE users SET ${userUpdateFields.join(', ')} WHERE id = ?`, userUpdateValues);

    // ✅ Update students table
    const studentUpdateFields = [
      'father_name = ?',
      'mother_name = ?',
      'identifying_name = ?',
      'mobile_number = ?',
      'university_id = ?',
      'date_of_birth = ?',
      'gender = ?',
      'category = ?',
      'address = ?',
      'full_name = ?',
      'country = ?'
    ];
    const studentUpdateValues = [
      father_name || '',

      mother_name || '',
      identifying_name || '',
      mobile_number || '',
      parsedUniversityId,
      date_of_birth || null,
      gender || '',
      category || '',
      address || '',
      full_name,
      country || ''
    ];

    if (photo) {
      studentUpdateFields.push('photo = ?');
      studentUpdateValues.push(photo);
    }

    if (documents) {
      studentUpdateFields.push('documents = ?');
      studentUpdateValues.push(documents);
    }

    studentUpdateValues.push(studentId);
    await db.query(
      `UPDATE students SET ${studentUpdateFields.join(', ')} WHERE id = ?`,
      studentUpdateValues
    );

    res.status(200).json({ message: 'Student updated successfully' });

  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
};


export const getStudentById = async (req, res) => {
  const { id } = req.params;
  try {
    const [student] = await db.query(`
        SELECT 
          s.*, 
          u.email, u.full_name, u.role 
        FROM students s 
        JOIN users u ON s.id = u.student_id
        WHERE s.id = ?
      `, [id]);

    if (student.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    const parsedRows = student.map((row) => ({
      ...row,
      photo: row.photo ? `${req.protocol}://${req.get("host")}${row.photo}` : null,
      documents: row.documents ? `${req.protocol}://${req.get("host")}${row.documents}` : null,
    }));
    res.status(200).json(parsedRows[0]);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
};








export const getStudentByProcessorId = async (req, res) => {
  const { processor_id } = req.params;
  try {
    const [student] = await db.query(`
        SELECT 
          s.*, 
          u.email, u.full_name, u.role 
        FROM students s 
        JOIN users u ON s.id = u.student_id
        WHERE s.processor_id = ?
      `, [processor_id]);

    if (student.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    const parsedRows = student.map((row) => ({
      ...row,
      photo: row.photo ? `${req.protocol}://${req.get("host")}${row.photo}` : null,
      documents: row.documents ? `${req.protocol}://${req.get("host")}${row.documents}` : null,
    }));
    res.status(200).json(parsedRows[0]);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
};


export const getStudentByCouseloerId = async (req, res) => {
  const { counselor_id } = req.params;
  try {
    const [student] = await db.query(`
        SELECT 
          s.*, 
          u.email, u.full_name, u.role 
        FROM students s 
        JOIN users u ON s.id = u.student_id
        WHERE s.counselor_id = ?
      `, [counselor_id]);

    if (student.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    const parsedRows = student.map((row) => ({
      ...row,
      photo: row.photo ? `${req.protocol}://${req.get("host")}${row.photo}` : null,
      documents: row.documents ? `${req.protocol}://${req.get("host")}${row.documents}` : null,
    }));
    res.status(200).json(parsedRows[0]);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  console.log("req.body : ", req.body);
  console.log("req.files : ", req.files);

  const {
    user_id,
    father_name,
    mother_name,
    identifying_name,
    university_id,
    date_of_birth,
    gender,
    category,
    address,
    full_name,
    phone,
    status,
    email,
    unique_id
  } = req.body;

  const photo = req.files?.photo?.[0] ? `/uploads/${req.files.photo[0].filename}` : null;
  const documents = req.files?.documents?.[0] ? `/uploads/${req.files.documents[0].filename}` : null;

  try {
    const [data] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    if (data.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { student_id, counselor_id, role } = data[0];
    let updateUserQuery;
    let updateUserParams;
    if (role === 'admin') {
      updateUserQuery = `UPDATE users SET email = COALESCE(?, email), full_name = COALESCE(?, full_name), address = COALESCE(?, address), phone = COALESCE(?, phone) WHERE id = ?`;
      updateUserParams = [email, full_name, address, phone, id];
    } else {
      updateUserQuery = `UPDATE users SET email = COALESCE(?, email), full_name = COALESCE(?, full_name) WHERE id = ?`;
      updateUserParams = [email, full_name, id];
    }


    if (student_id) {
      const [studentResult] = await db.query(
        `UPDATE students SET 
         unique_id = COALESCE(?, unique_id),
          user_id = COALESCE(?, user_id),
          father_name = COALESCE(?, father_name),
          identifying_name = COALESCE(?, identifying_name),
          mother_name = COALESCE(?, mother_name),
          mobile_number = COALESCE(?, mobile_number),
          university_id = COALESCE(?, university_id),
          date_of_birth = COALESCE(?, date_of_birth),
          gender = COALESCE(?, gender),
          category = COALESCE(?, category),
          address = COALESCE(?, address),
          photo = COALESCE(?, photo),
          documents = COALESCE(?, documents)
        WHERE id = ?`,
        [

          user_id,
          father_name,
          identifying_name,
          mother_name,
unique_id,
          phone,
          university_id,
          date_of_birth,
          gender,
          category,
          address,
          photo,
          documents,
          student_id
        ]
      );

      if (studentResult.affectedRows === 0) {
        return res.status(404).json({ message: 'Student not found' });
      }
    }





    

    if (counselor_id) {
      const [counselorResult] = await db.query(
        `UPDATE counselors SET 
          user_id = COALESCE(?, user_id),
          phone = COALESCE(?, phone),
          university_id = COALESCE(?, university_id),
          status = COALESCE(?, status)
        WHERE id = ?`,
        [user_id, phone, university_id, status, counselor_id]
      );

      if (counselorResult.affectedRows === 0) {
        return res.status(404).json({ message: 'Counselor not found' });
      }
    }

    await db.query(updateUserQuery, updateUserParams);

    res.status(200).json({ message: 'User information updated successfully.' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
};


export const deleteStudent = async (req, res) => {
  const { id } = req.params;

  try {
    // Check associated user
    const [user] = await db.query('SELECT id FROM users WHERE student_id = ?', [id]);
    if (!user.length) {
      return res.status(404).json({ message: 'Associated user not found' });
    }
    const user_id = user[0].id;

    // Delete related data
    await db.query('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?', [user_id, user_id]);
    const [studentResult] = await db.query('DELETE FROM students WHERE id = ?', [id]);

    if (studentResult.affectedRows === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    await db.query('DELETE FROM users WHERE id = ?', [user_id]);
    await db.query('DELETE FROM tasks WHERE student_id = ?', [id]);

    res.status(200).json({ message: 'Student and related data deleted successfully' });

  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const changeNewPassword = async (req, res) => {
  const { id } = req.params; // Get from token
  const { password, newPassword } = req.body;

  if (!password || !newPassword) {
    return res.status(400).json({ message: 'Both old and new passwords are required' });
  }
  try {
    const [user] = await db.query('SELECT * FROM users WHERE id = ?', [id]);

    if (user.length === 0 || !(await bcrypt.compare(password, user[0].password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, id]);
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getAllByRoles = async (req, res) => {
  const { role } = req.params;
  try {
    let query;
    let params;
    switch (role) {
      case 'admin':
        query = 'SELECT full_name, role, address, phone FROM users WHERE role = ?';
        params = [role];
        break;
      case 'counselor':
        query = 'SELECT full_name, role, counselor_id , id FROM users WHERE role = ?';
        params = [role];
        break;
      case 'student':
        query = 'SELECT full_name, role, student_id, id FROM users WHERE role = ?';
        params = [role];
        break;
      default:
        return res.status(400).json({ message: 'Invalid role' });
    }
    const [users] = await db.query(query, params);
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users by role:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
}




// export const editStudent = async (req, res) => {
//   const { id } = req.params;

//   try {
//     const updatedData = req.body;
//     console.log("Updated Data:", updatedData);

//     // ✅ Format date to MySQL format
//     function formatDateForMySQL(date) {
//       if (!date) return null;
//       const d = new Date(date);
//       return d.toISOString().slice(0, 19).replace('T', ' ');
//     }

//     // ✅ Stringify JSON/Array fields
//     if (updatedData.academic_info) {
//       updatedData.academic_info = JSON.stringify(updatedData.academic_info);
//     }
//     if (updatedData.english_proficiency) {
//       updatedData.english_proficiency = JSON.stringify(updatedData.english_proficiency);
//     }
//     if (updatedData.job_professional) {
//       updatedData.job_professional = JSON.stringify(updatedData.job_professional);
//     }
//     if (updatedData.refused_countries) {
//       updatedData.refused_countries = JSON.stringify(updatedData.refused_countries);
//     }
//     if (updatedData.travel_history) {
//       updatedData.travel_history = JSON.stringify(updatedData.travel_history);
//     }

//     // ✅ Format datetime fields
//     if (updatedData.created_at) {
//       updatedData.created_at = formatDateForMySQL(updatedData.created_at);
//     }
//     updatedData.updated_at = formatDateForMySQL(new Date()); // always update this to current time

//     // ✅ Build query
//     const fields = Object.keys(updatedData).map(field => `${field} = ?`).join(', ');
//     const values = Object.values(updatedData);

//     const query = `UPDATE students SET ${fields} WHERE id = ?`;
//     values.push(id);

//     const [updateResult] = await db.query(query, values);

//     // ✅ Fetch updated student
//     const [rows] = await db.query('SELECT * FROM students WHERE id = ?', [id]);

//     if (rows.length === 0) {
//       return res.status(404).json({ message: 'Student not found after update' });
//     }

//     // ✅ Parse JSON fields
//     const student = rows[0];
//     try {
//       student.academic_info = JSON.parse(student.academic_info || '[]');
//       student.english_proficiency = JSON.parse(student.english_proficiency || '[]');
//       student.job_professional = JSON.parse(student.job_professional || '[]');
//       student.refused_countries = JSON.parse(student.refused_countries || '[]');
//       student.travel_history = JSON.parse(student.travel_history || '[]');
//     } catch (jsonErr) {
//       console.warn('Error parsing JSON fields:', jsonErr);
//     }

//     res.status(200).json({
//       message: 'Student updated successfully',
//       student: student
//     });

//   } catch (error) {
//     console.error('Edit Student Error:', error);
//     res.status(500).json({ message: 'Server error while editing student' });
//   }
// };



export const editStudent = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedData = req.body;
    console.log("Updated Data:", updatedData);

    // ✅ Date format helpers
    const formatDateOnly = (date) => {
      if (!date) return null;
      return new Date(date).toISOString().split('T')[0]; // 'YYYY-MM-DD'
    };

    const formatDateTime = (date) => {
      if (!date) return null;
      return new Date(date).toISOString().slice(0, 19).replace('T', ' '); // 'YYYY-MM-DD HH:mm:ss'
    };

    // ✅ Format all known date-only fields
    const dateOnlyFields = [
      'date_of_birth',
      'follow_up',
      'passport_1_expiry',
      'passport_2_expiry',
      'passport_3_expiry',
    ];
    dateOnlyFields.forEach(field => {
      if (updatedData[field]) {
        updatedData[field] = formatDateOnly(updatedData[field]);
      }
    });

    // ✅ Format all known datetime fields
    const dateTimeFields = ['created_at', 'updated_at'];
    dateTimeFields.forEach(field => {
      if (updatedData[field]) {
        updatedData[field] = formatDateTime(updatedData[field]);
      }
    });

    // ✅ Always update `updated_at` to current datetime
    updatedData.updated_at = formatDateTime(new Date());

    // ✅ Stringify JSON/Array fields
    const jsonFields = [
      'academic_info',
      'english_proficiency',
      'job_professional',
      'refused_countries',
      'travel_history'
    ];
    jsonFields.forEach(field => {
      if (updatedData[field]) {
        updatedData[field] = JSON.stringify(updatedData[field]);
      }
    });

    // ✅ Build update query
    const fields = Object.keys(updatedData).map(field => `${field} = ?`).join(', ');
    const values = Object.values(updatedData);
    const query = `UPDATE students SET ${fields} WHERE id = ?`;
    values.push(id);

    const [updateResult] = await db.query(query, values);

    // ✅ Fetch updated student
    const [rows] = await db.query('SELECT * FROM students WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Student not found after update' });
    }

    // ✅ Parse back JSON fields for response
    const student = rows[0];
    jsonFields.forEach(field => {
      try {
        student[field] = JSON.parse(student[field] || '[]');
      } catch (err) {
        console.warn(`Error parsing ${field}:`, err);
      }
    });

    res.status(200).json({
      message: 'Student updated successfully',
      student
    });

  } catch (error) {
    console.error('Edit Student Error:', error);
    res.status(500).json({ message: 'Server error while editing student' });
  }
};






import { sendEmail } from '../utils/sendEmail.js';

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ status: 'fail', message: 'User not found with this email' });
    }

    const user = users[0];

    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save token to DB
    await db.query(
      'UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?',
      [hashedToken, tokenExpiry, user.id]
    );

    // Send reset link
    await sendEmail({
      email: user.email,
      subject: 'Reset Your Password',
      resetToken: resetToken
    });

    res.status(200).json({
      status: 'success',
      message: 'Reset token sent to email!',
      resetToken: resetToken // Only for debugging (remove in production)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Error sending reset email' });
  }
};





export const resetPassword = async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;

  if (!token || !newPassword || !confirmPassword) {
    return res.status(400).json({ status: 'fail', message: 'All fields are required.' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ status: 'fail', message: 'Passwords do not match.' });
  }

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const [users] = await db.query(
      'SELECT * FROM users WHERE password_reset_token = ? AND password_reset_expires > ?',
      [hashedToken, new Date()]
    );

    if (users.length === 0) {
      return res.status(400).json({ status: 'fail', message: 'Token is invalid or has expired.' });
    }

    const user = users[0];
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear token
    await db.query(
      'UPDATE users SET password = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    res.status(200).json({
      status: 'success',
      message: 'Password reset successfully.'
    });

  } catch (err) {
    console.error('Error resetting password:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
};




export const getVisaProcessByuniversityidsss = async (req, res) => {
  const { university_id, student_id  } = req.params;

  try {
    const [rows] = await db.query(
      // 'SELECT * FROM visa_process WHERE university_id = ? AND student_id = ?',
         `
      SELECT 
        vp.*,
        u.name AS university_names
      FROM visa_process vp
      LEFT JOIN universities u 
        ON vp.university_id = u.id
      WHERE vp.university_id = ? 
        AND vp.student_id = ?
      `,
      [university_id, student_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Visa application not found" });
    }

    return res.status(200).json(rows); 
  } catch (error) {
    console.error(`internal server error : ${error}`);
    res.status(500).json({ message: 'internal server error' });
  }
};


export const getVisaProcessBystudentidsss = async (req, res) => {
  const { student_id } = req.params;

  try {
    const [rows] = await db.query(
      `
      SELECT 
        vp.*,
        u.name AS university_names
      FROM visa_process vp
      LEFT JOIN universities u 
        ON vp.university_id = u.id
      WHERE vp.student_id = ?
      `,
      [student_id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Visa application not found for this student",
      });
    }

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Internal server error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


