// POST /api/visa-process/create
import db from '../config/db.js';
import { studentNameById } from '../models/student.model.js';
import { universityNameById } from '../models/universities.model.js';
import { v2 as cloudinary } from "cloudinary";
import fs from 'fs';

cloudinary.config({
    cloud_name: 'dkqcqrrbp',
    api_key: '418838712271323',
    api_secret: 'p12EKWICdyHWx8LcihuWYqIruWQ'
});

// Helper function to handle Cloudinary uploads
const handleFileUploads = async (files, folder = "student_application_docs") => {
    const uploadedUrls = {};
    if (!files) return uploadedUrls;

    for (const key in files) {
        const file = files[key];
        if (file && file.tempFilePath) {
            console.log(`Uploading ${key}: Size=${file.size}, Type=${file.mimetype}, Path=${file.tempFilePath}`);
            try {
                const result = await cloudinary.uploader.upload(file.tempFilePath, {
                    folder: folder,
                    resource_type: "auto"
                });
                uploadedUrls[key] = result.secure_url;
                // Delete temp file after upload
                if (fs.existsSync(file.tempFilePath)) {
                    fs.unlinkSync(file.tempFilePath);
                }
            } catch (err) {
                console.error(`Cloudinary upload error for ${key}:`, err);
                // Also log the actual Cloudinary error message if available
                if (err.message) console.error("Cloudinary error message:", err.message);
                throw new Error(`Upload failed for ${key}`);
            }
        }
    }
    return uploadedUrls;
};

// Helper to filter out non-database columns
const sanitizeVisaProcessData = (data) => {
    const forbiddenFields = [
        'id', 'created_at', 'updated_at', 'message', 
        'affectedRows', 'updatedFields', 'country', 
        'university_name', 'university_names', 'logo_url', 'location',
        'counselor_name', 'processor_name', 'student_name'
    ];
    const sanitized = {};
    
    Object.keys(data).forEach(key => {
        // Skip empty keys, numeric keys, or forbidden fields
        if (key && isNaN(key) && !forbiddenFields.includes(key)) {
            let value = data[key];
            
            // If value is an array, take the first element (prevents SQL errors for multi-value fields)
            if (Array.isArray(value)) {
                value = value[0];
            }
            
            // Convert empty strings to NULL
            if (value === '') value = null;
            sanitized[key] = value;
        }
    });
    
    return sanitized;
};





//   export const createVisaProcess = async (req, res) => {
//     const data = req.body;

//     // Remove `created_at` if present, so MySQL uses default
//     if ('id' in data) delete data.id;
//     if ('created_at' in data) {
//         delete data.created_at;
//     }

//     const requiredFields = [
//         'student_id','full_name', 'email', 'phone', 'date_of_birth',
//         'passport_no', 'applied_program', 'intake',
//         'assigned_counselor', 'registration_date', 'source'
//     ];
//     for (let field of requiredFields) {
//         if (!data[field]) {
//             return res.status(400).json({ message: `${field} is required.` });
//         }
//     }

//     try {
//         // ✅ Step 1: Student ke counselor_id aur processor_id fetch karo
//         const [studentRows] = await db.query(
//             "SELECT counselor_id, processor_id FROM students WHERE id = ?",
//             [data.student_id]
//         );

//         if (studentRows.length === 0) {
//             return res.status(404).json({ message: "Student not found" });
//         }

//         // ✅ Step 2: Automatically assign karo
//         data.counselor_id = studentRows[0].counselor_id;
//         data.processor_id = studentRows[0].processor_id;

//         // ✅ Step 3: Insert visa_process record
//         const [result] = await db.query('INSERT INTO visa_process SET ?', data);

//         res.status(201).json({ 
//             message: 'Visa process started', 
//             id: result.insertId, 
//             ...data 
//         });
//     } catch (error) {
//         console.error('Error:', error);
//         res.status(500).json({ message: 'Failed to create record', error: error.message });
//     }
// };

export const createVisaProcess = async (req, res) => {
    const rawData = req.body;
    const files = req.files;

    try {
        // Step 1: Handle file uploads if any
        const uploadedDocs = await handleFileUploads(files);
        const data = sanitizeVisaProcessData({ ...rawData, ...uploadedDocs });

        // Required fields check
        const requiredFields = [
            'student_id', 'full_name', 'email', 'phone', 'date_of_birth',
            'passport_no', 'applied_program', 'intake',
            'assigned_counselor', 'registration_date', 'source'
        ];
        for (let field of requiredFields) {
            if (!data[field]) {
                return res.status(400).json({ message: `${field} is required.` });
            }
        }

        // Step 2: Fetch counselor and processor from student record (fallback)
        const [studentRows] = await db.query(
            "SELECT counselor_id, processor_id FROM students WHERE id = ?",
            [data.student_id]
        );

        if (studentRows.length === 0) {
            return res.status(404).json({ message: "Student not found" });
        }

        // Use passed values if available, otherwise use student record defaults
        data.counselor_id = data.counselor_id || studentRows[0].counselor_id;
        data.processor_id = data.processor_id || studentRows[0].processor_id;

        // Step 3: Insert visa_process record
        const [result] = await db.query('INSERT INTO visa_process SET ?', [data]);

        res.status(201).json({
            message: 'Visa process started successfully',
            id: result.insertId,
            ...data
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Failed to create record', error: error.message });
    }
};





// ✅ Controller
export const getVisaProcessByStudentId = async (req, res) => {
  const { student_id, university_id } = req.params;

  try {
    let query = `
      SELECT vp.*, u.name as university_name 
      FROM visa_process vp
      LEFT JOIN universities u ON vp.university_id = u.id
      WHERE vp.student_id = ?
    `;
    let values = [student_id];

    if (university_id) {
      query += " AND vp.university_id = ?";
      values.push(university_id);
    }

    // Prioritize records with more completed stages, then the newest ID
    query += ` ORDER BY (
        registration_visa_processing_stage + 
        documents_visa_processing_stage + 
        university_application_visa_processing_stage + 
        fee_payment_visa_processing_stage + 
        tuition_fee_visa_processing_stage +
        appointment_visa_processing_stage +
        visa_approval_visa_processing_stage
    ) DESC, vp.id DESC`;

    const [rows] = await db.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Visa application not found" });
    }

    // If university_id is provided, return single object for backward compatibility if needed, 
    // but usually arrays are safer for lists.
    // However, StudentVisaProcessList expects an array or object.
    return res.status(200).json(university_id ? rows[0] : rows);
  } catch (error) {
    console.error(`Internal server error : ${error}`);
    res.status(500).json({ message: 'Internal server error' });
  }
};



export const updateVisaProcess = async (req, res) => {
    const id = req.params.id;
    const rawUpdates = req.body;
    const files = req.files;

    try {
        console.log("Processing update for ID:", id);

        // Step 1: Upload new files if any
        const uploadedDocs = await handleFileUploads(files);

        // Step 2: Sanitize data and merge with new document URLs
        const updates = sanitizeVisaProcessData({ ...rawUpdates, ...uploadedDocs });

        // ✅ Auto-set stage completion flags based on updated fields
        if (updates.full_name) updates.registration_visa_processing_stage = 1;
        
        if (updates.passport_doc || updates.ssc_doc || updates.hsc_doc) {
            updates.documents_visa_processing_stage = 1;
        }
        
        if (updates.university_name || updates.program_name || updates.application_id) {
            updates.university_application_visa_processing_stage = 1;
        }
        
        if (updates.fee_amount || updates.fee_status === 'Paid') {
            updates.fee_payment_visa_processing_stage = 1;
        }
        
        if (updates.interview_status === 'Completed' || updates.interview_result || updates.interview_date) {
            updates.university_interview_visa_processing_stage = 1;
        }
        
        if (updates.conditional_offer_upload || updates.conditional_offer_status === 'Received') {
            updates.offer_letter_visa_processing_stage = 1;
        }
        
        if (updates.tuition_fee_amount || updates.tuition_fee_status === 'Paid') {
            updates.tuition_fee_visa_processing_stage = 1;
        }
        
        if (updates.main_offer_upload || updates.main_offer_status === 'Received') {
            updates.final_offer_visa_processing_stage = 1;
        }

        if (updates.motivation_letter || updates.bank_statement) {
            updates.embassy_docs_visa_processing_stage = 1;
        }

        if (updates.appointment_location || updates.appointment_status === 'Scheduled' || updates.appointment_status === 'Completed') {
            updates.appointment_visa_processing_stage = 1;
        }

        if (updates.visa_status || updates.visa_approval_visa_processing_stage) {
            updates.visa_approval_visa_processing_stage = 1;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No data provided for update" });
        }

        // Step 3: Apply update to database
        const [result] = await db.query('UPDATE visa_process SET ? WHERE id = ?', [updates, id]);

        res.status(200).json({
            message: 'Visa process updated successfully',
            affectedRows: result.affectedRows,
            updatedFields: updates
        });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ message: 'Update failed', error: error.message });
    }
};


// GET /api/visa-process
export const GetVisaProcess = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT vp.*, s.country, u.name as university_name 
            FROM visa_process vp
            LEFT JOIN students s ON vp.student_id = s.id
            LEFT JOIN universities u ON vp.university_id = u.id
            ORDER BY (
        registration_visa_processing_stage + 
        documents_visa_processing_stage + 
        university_application_visa_processing_stage + 
        fee_payment_visa_processing_stage + 
        tuition_fee_visa_processing_stage +
        appointment_visa_processing_stage +
        visa_approval_visa_processing_stage
    ) DESC, vp.created_at DESC
        `);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching visa applications:', error);
        res.status(500).json({ message: 'Error retrieving visa applications', error: error.message });
    }
};


// export const GetVisaProcessbyfilter = async (req, res) => {
//     try {
//         const filters = req.query;
//         let query = `
//             SELECT 
//                 vp.*,
//                 s.country
//             FROM visa_process vp
//             LEFT JOIN students s ON vp.student_id = s.id
//         `;

//         let conditions = [];
//         let values = [];

//         const stageFields = [
//             'registration_visa_processing_stage',
//             'documents_visa_processing_stage',
//             'university_application_visa_processing_stage',
//             'fee_payment_visa_processing_stage',
//             'university_interview_visa_processing_stage',
//             'offer_letter_visa_processing_stage',
//             'tuition_fee_visa_processing_stage',
//             'final_offer_visa_processing_stage',
//             'embassy_docs_visa_processing_stage',
//             'appointment_visa_processing_stage',
//             'visa_approval_visa_processing_stage',
//             'visa_rejection_visa_processing_stage'
//         ];

//         // Build WHERE conditions
//         for (let field of stageFields) {
//             if (filters[field] !== undefined) {
//                 conditions.push(`vp.${field} = ?`);
//                 values.push(filters[field]);
//             }
//         }

//         // Optional filter by country
//         if (filters.country) {
//             conditions.push(`s.country = ?`);
//             values.push(filters.country);
//         }

//         if (conditions.length > 0) {
//             query += ' WHERE ' + conditions.join(' AND ');
//         }

//         query += ' ORDER BY vp.created_at DESC';

//         const [rows] = await db.query(query, values);

//         res.status(200).json(rows);
//     } catch (error) {
//         console.error('Error fetching visa applications:', error);
//         res.status(500).json({ 
//             message: 'Error retrieving visa applications', 
//             error: error.message 
//         });
//     }
// };

export const GetVisaProcessbyfilter = async (req, res) => {
    try {
        const filters = req.query;
        let query = `
    SELECT 
        vp.*,
        vp.full_name as student_name, 
        vp.email, 
        vp.phone as mobile_number, 
        s.country,
        u.name as university_name
    FROM visa_process vp
    INNER JOIN (
        SELECT student_id, university_id, MAX(id) as max_id
        FROM visa_process
        GROUP BY student_id, university_id
    ) latest ON vp.id = latest.max_id
    LEFT JOIN students s ON vp.student_id = s.id
    LEFT JOIN universities u ON vp.university_id = u.id
`;

        let conditions = [];
        let values = [];

        const stageFields = [
            'registration_visa_processing_stage',
            'documents_visa_processing_stage',
            'university_application_visa_processing_stage',
            'fee_payment_visa_processing_stage',
            'university_interview_visa_processing_stage',
            'offer_letter_visa_processing_stage',
            'tuition_fee_visa_processing_stage',
            'final_offer_visa_processing_stage',
            'embassy_docs_visa_processing_stage',
            'appointment_visa_processing_stage',
            'visa_approval_visa_processing_stage',
            'visa_rejection_visa_processing_stage'
        ];

        // Build WHERE conditions
        for (let field of stageFields) {
            if (filters[field] !== undefined) {
                conditions.push(`vp.${field} = ?`);
                values.push(filters[field]);
            }
        }

        // Optional filter by country
        if (filters.country) {
            conditions.push(`s.country = ?`);
            values.push(filters.country);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY vp.created_at DESC';

        const [rows] = await db.query(query, values);

        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching visa applications:', error);
        res.status(500).json({ 
            message: 'Error retrieving visa applications', 
            error: error.message 
        });
    }
};









// GET /api/visa-process/:id
export const getVisaApplicationById = async (req, res) => {
    const id = req.params.id;
    try {
        const [rows] = await db.query('SELECT * FROM visa_process WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Visa application not found' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching visa application by ID:', error);
        res.status(500).json({ message: 'Error retrieving visa application', error: error.message });
    }
};


// DELETE /api/visa-process/:id
export const deleteVisaApplication = async (req, res) => {
    const id = req.params.id;
    try {
        const [result] = await db.query('DELETE FROM visa_process WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Visa application not found or already deleted' });
        }
        res.status(200).json({ message: 'Visa application deleted successfully' });
    } catch (error) {
        console.error('Error deleting visa application:', error);
        res.status(500).json({ message: 'Error deleting visa application', error: error.message });
    }
};

// Update only one document status
export const updateDocumentStatus = async (req, res) => {
  const { id } = req.params;                // visa_process.id
  const { field, status } = req.body;       // Example: { field: "passport_doc_status", status: "Approved" }

  // ✅ Allowed statuses
  const allowedStatus = ["Pending", "Approved", "Rejected"];
  if (!allowedStatus.includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  // ✅ Allowed fields
  const allowedFields = [
    "passport_doc_status","photo_doc_status","ssc_doc_status","hsc_doc_status",
    "bachelor_doc_status","ielts_doc_status","cv_doc_status","sop_doc_status",
    "medical_doc_status","other_doc_status","proof_submission_doc_status",
    "proof_fees_payment_doc_status","recording_doc_status","offer_letter_upload_doc_status",
    "proof_tuition_fees_payment_doc_status", "main_offer_upload_doc_status", "motivation_letter_doc_status",
    "europass_cv_doc_status","bank_statement_doc_status","birth_certificate_doc_status",
    "tax_proof_doc_status","business_documents_doc_status","ca_certificate_doc_status",
    "health_travel_insurance_doc_status","residence_form_doc_status","flight_booking_doc_status",
    "police_clearance_doc_status","family_certificate_doc_status","application_form_doc_status",
    "appointment_letter_doc_status","visa_sticker_upload_doc_status"
  ];

  if (!allowedFields.includes(field)) {
    return res.status(400).json({ message: "Invalid document field" });
  }

  try {
    const [result] = await db.query(
      `UPDATE visa_process SET ${field} = ? WHERE id = ?`,
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Visa application not found" });
    }

    res.json({ message: `Status updated for ${field}`, newStatus: status });
  } catch (error) {
    res.status(500).json({ message: "Error updating document status", error: error.message });
  }
};



export const getVisaProcessByprocessorid = async (req, res) => {
  const { processor_id } = req.params;
  const filters = req.query;

  try {
    let query = `
      SELECT 
        vp.*,
        s.country,
        u.name AS university_name,
        u.logo_url,
        u.location
      FROM visa_process vp
      INNER JOIN (
          SELECT student_id, university_id, MAX(id) as max_id
          FROM visa_process
          GROUP BY student_id, university_id
      ) latest ON vp.id = latest.max_id
      LEFT JOIN students s ON vp.student_id = s.id
      LEFT JOIN universities u ON vp.university_id = u.id
      WHERE (vp.processor_id = ? OR s.processor_id = ?)
    `;

    let conditions = [];
    let values = [processor_id, processor_id];

    const stageFields = [
      'registration_visa_processing_stage',
      'documents_visa_processing_stage',
      'university_application_visa_processing_stage',
      'fee_payment_visa_processing_stage',
      'university_interview_visa_processing_stage',
      'offer_letter_visa_processing_stage',
      'tuition_fee_visa_processing_stage',
      'final_offer_visa_processing_stage',
      'embassy_docs_visa_processing_stage',
      'appointment_visa_processing_stage',
      'visa_approval_visa_processing_stage',
      'visa_rejection_visa_processing_stage'
    ];

    // stage filter
    for (let field of stageFields) {
      if (filters[field] !== undefined) {
        conditions.push(`vp.${field} = ?`);
        values.push(filters[field]);
      }
    }

    if (conditions.length > 0) {
      query += " AND " + conditions.join(" AND ");
    }

    query += " ORDER BY vp.created_at DESC";

    const [rows] = await db.query(query, values);

    // Return empty array instead of 404 to prevent frontend errors
    return res.status(200).json(rows || []);

  } catch (error) {
    console.error("Error fetching visa applications by processor:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};





export const getVisaProcessBycounselorid = async (req, res) => {
  const { counselor_id } = req.params;
  const filters = req.query; // stage filters from query params

  try {
    let query = `
      SELECT 
        vp.*,
        s.country,
        u.name AS university_name,
        u.logo_url,
        u.location
      FROM visa_process vp
      INNER JOIN (
          SELECT student_id, university_id, MAX(id) as max_id
          FROM visa_process
          GROUP BY student_id, university_id
      ) latest ON vp.id = latest.max_id
      LEFT JOIN students s ON vp.student_id = s.id
      LEFT JOIN universities u ON vp.university_id = u.id
      WHERE (vp.counselor_id = ? OR s.counselor_id = ?)
    `;

    let conditions = [];
    let values = [counselor_id, counselor_id];

    // ✅ Stage fields list
    const stageFields = [
      'registration_visa_processing_stage',
      'documents_visa_processing_stage',
      'university_application_visa_processing_stage',
      'fee_payment_visa_processing_stage',
      'university_interview_visa_processing_stage',
      'offer_letter_visa_processing_stage',
      'tuition_fee_visa_processing_stage',
      'final_offer_visa_processing_stage',
      'embassy_docs_visa_processing_stage',
      'appointment_visa_processing_stage',
      'visa_approval_visa_processing_stage',
      'visa_rejection_visa_processing_stage'
    ];

    // ✅ Add stage filters dynamically
    for (let field of stageFields) {
      if (filters[field] !== undefined) {
        conditions.push(`vp.${field} = ?`);
        values.push(filters[field]); // expect 0 or 1
      }
    }

    if (conditions.length > 0) {
      query += " AND " + conditions.join(" AND ");
    }

    query += " ORDER BY vp.created_at DESC";

    const [rows] = await db.query(query, values);

    // Return empty array instead of 404 to prevent frontend errors
    return res.status(200).json(rows || []);
  } catch (error) {
    console.error("Error fetching visa applications by counselor:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};









