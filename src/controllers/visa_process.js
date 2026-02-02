// POST /api/visa-process/create
import db from '../config/db.js';
import { studentNameById } from '../models/student.model.js';
import { universityNameById } from '../models/universities.model.js';
import cloudinary from "cloudinary";
import fs from 'fs';

cloudinary.config({
    cloud_name: 'dkqcqrrbp',
    api_key: '418838712271323',
    api_secret: 'p12EKWICdyHWx8LcihuWYqIruWQ'
});





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
    const data = req.body;

    // Remove created_at & id if present
    if ('id' in data) delete data.id;
    if ('created_at' in data) delete data.created_at;

    // Required fields check
    const requiredFields = [
        'student_id','full_name', 'email', 'phone', 'date_of_birth',
        'passport_no', 'applied_program', 'intake',
        'assigned_counselor', 'registration_date', 'source'
    ];
    for (let field of requiredFields) {
        if (!data[field]) {
            return res.status(400).json({ message: `${field} is required.` });
        }
    }

    try {
        // ✅ Step 1: Student ke counselor_id aur processor_id fetch karo
        const [studentRows] = await db.query(
            "SELECT counselor_id, processor_id FROM students WHERE id = ?",
            [data.student_id]
        );

        if (studentRows.length === 0) {
            return res.status(404).json({ message: "Student not found" });
        }

        // ✅ Step 2: Automatically assign karo
        data.counselor_id = studentRows[0].counselor_id;
        data.processor_id = studentRows[0].processor_id;

     

        // ✅ Step 4: Insert visa_process record
        const [result] = await db.query('INSERT INTO visa_process SET ?', data);

        res.status(201).json({ 
            message: 'Visa process started', 
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
    const [rows] = await db.query(
      'SELECT * FROM visa_process WHERE student_id = ? AND university_id = ?',
      [student_id, university_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Visa application not found" });
    }

    return res.status(200).json(rows[0]); // agar ek hi chahiye to rows[0] use karo
  } catch (error) {
    console.error(`Internal server error : ${error}`);
    res.status(500).json({ message: 'Internal server error' });
  }
};



export const updateVisaProcess = async (req, res) => {
  const id = req.params.id;
  const updates = { ...req.body };
  const files = req.files;
    console.log("Received ID:", id);
  console.log("Initial updates from body:", updates);
  console.log("Received files:", files);

  // ✅ Upload files to Cloudinary and set public URLs
  for (const key in files) {
    const file = files[key];
    if (file && file.tempFilePath) {
      try {
        const result = await cloudinary.uploader.upload(file.tempFilePath, {
          folder: "student_application_docs"
        });
        updates[key] = result.secure_url;
      } catch (err) {
        console.error(`Cloudinary upload error for ${key}:`, err);
        return res.status(500).json({ message: `Upload failed for ${key}` });
      }
    }
  }

  // ✅ Convert empty strings to NULL
  Object.keys(updates).forEach((key) => {
    if (updates[key] === '') {
      updates[key] = null;
    }
  });
    console.log("Final updates to apply:", updates);

  try {
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
        const [rows] = await db.query('SELECT * FROM visa_process ORDER BY created_at DESC');
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
        vp.id,
        vp.student_id,
        vp.processor_id,
        vp.counselor_id,
        vp.university_id,

        vp.registration_visa_processing_stage,
        vp.documents_visa_processing_stage,
        vp.university_application_visa_processing_stage,
        vp.fee_payment_visa_processing_stage,
        vp.university_interview_visa_processing_stage,
        vp.offer_letter_visa_processing_stage,
        vp.tuition_fee_visa_processing_stage,
        vp.final_offer_visa_processing_stage,
        vp.embassy_docs_visa_processing_stage,
        vp.appointment_visa_processing_stage,
        vp.visa_approval_visa_processing_stage,
        vp.visa_rejection_visa_processing_stage,

        vp.full_name,
        vp.email,
        vp.phone,

        vp.date_of_birth,
        s.country,   -- ✅ date_of_birth ke turant baad country

        vp.passport_no,
        vp.applied_program,
        vp.intake,
        vp.assigned_counselor,
        vp.registration_date,
        vp.source,
        vp.passport_doc,
        vp.photo_doc,
        vp.ssc_doc,
        vp.hsc_doc,
        vp.bachelor_doc,
        vp.ielts_doc,
        vp.cv_doc,
        vp.sop_doc,
        vp.medical_doc,
        vp.other_doc,
        vp.doc_status,
        vp.university_name,
        vp.program_name,
        vp.submission_date,
        vp.submission_method,
        vp.application_proof,
        vp.application_id,
        vp.application_status,
        vp.fee_amount,
        vp.fee_method,
        vp.fee_date,
        vp.fee_proof,
        vp.fee_status,
        vp.interview_date,
        vp.interview_platform,
        vp.interview_status,
        vp.interviewer_name,
        vp.interview_recording,
        vp.interview_result,
        vp.interview_feedback,
        vp.interview_summary,
        vp.interview_result_date,
        vp.conditional_offer_upload,
        vp.conditional_offer_date,
        vp.conditional_conditions,
        vp.conditional_offer_status,
        vp.tuition_fee_amount,
        vp.tuition_fee_date,
        vp.tuition_fee_proof,
        vp.tuition_fee_status,
        vp.tuition_comments,
        vp.main_offer_upload,
        vp.main_offer_date,
        vp.main_offer_status,
        vp.motivation_letter,
        vp.europass_cv,
        vp.bank_statement,
        vp.birth_certificate,
        vp.tax_proof,
        vp.business_docs,
        vp.ca_certificate,
        vp.health_insurance,
        vp.residence_form,
        vp.flight_booking,
        vp.police_clearance,
        vp.family_certificate,
        vp.application_form,
        vp.appointment_location,
        vp.appointment_datetime,
        vp.appointment_letter,
        vp.appointment_status,
        vp.embassy_result_date,
        vp.embassy_feedback,
        vp.embassy_result,
        vp.embassy_notes,
        vp.embassy_summary,
        vp.visa_status,
        vp.decision_date,
        vp.visa_sticker_upload,
        vp.rejection_reason,
        vp.appeal_status,
        vp.created_at,

        vp.passport_doc_status,
        vp.photo_doc_status,
        vp.ssc_doc_status,
        vp.hsc_doc_status,
        vp.bachelor_doc_status,
        vp.ielts_doc_status,
        vp.cv_doc_status,
        vp.sop_doc_status,
        vp.medical_doc_status,
        vp.other_doc_status,
        vp.proof_submission_doc_status,
        vp.proof_fees_payment_doc_status,
        vp.recording_doc_status,
        vp.offer_letter_upload_doc_status,
        vp.proof_tuition_fees_payment_doc_status,
        vp.motivation_letter_doc_status,
        vp.europass_cv_doc_status,
        vp.bank_statement_doc_status,
        vp.birth_certificate_doc_status,
        vp.tax_proof_doc_status,
        vp.business_documents_doc_status,
        vp.ca_certificate_doc_status,
        vp.health_travel_insurance_doc_status,
        vp.residence_form_doc_status,
        vp.flight_booking_doc_status,
        vp.police_clearance_doc_status,
        vp.family_certificate_doc_status,
        vp.application_form_doc_status,
        vp.appointment_letter_doc_status,
        vp.visa_sticker_upload_doc_status,
        vp.main_offer_upload_doc_status,
        vp.tuition_fee_proof_status,
        vp.fee_proof_status,
        vp.application_proof_status,
        vp.tuition_fee_currency
    FROM visa_process vp
    LEFT JOIN students s ON vp.student_id = s.id
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



// export const getVisaProcessByprocessorid = async (req, res) => {
//   const { processor_id } = req.params;
//   const filters = req.query; // stage filters from query params

//   try {
//     let query = `
//       SELECT vp.*, 
//              u.name AS university_name, 
//              u.logo_url, 
//              u.location
//       FROM visa_process vp
//       LEFT JOIN universities u ON vp.university_id = u.id
//       WHERE vp.processor_id = ?
//     `;

//     let conditions = [];
//     let values = [processor_id];

//     // ✅ Stage fields list
//     const stageFields = [
//       'registration_visa_processing_stage',
//       'documents_visa_processing_stage',
//       'university_application_visa_processing_stage',
//       'fee_payment_visa_processing_stage',
//       'university_interview_visa_processing_stage',
//       'offer_letter_visa_processing_stage',
//       'tuition_fee_visa_processing_stage',
//       'final_offer_visa_processing_stage',
//       'embassy_docs_visa_processing_stage',
//       'appointment_visa_processing_stage',
//       'visa_approval_visa_processing_stage',
//       'visa_rejection_visa_processing_stage'
//     ];

//     // ✅ Add stage filters dynamically
//     for (let field of stageFields) {
//       if (filters[field] !== undefined) {
//         conditions.push(`vp.${field} = ?`);
//         values.push(filters[field]);
//       }
//     }

//     if (conditions.length > 0) {
//       query += " AND " + conditions.join(" AND ");
//     }

//     query += " ORDER BY vp.created_at DESC";

//     const [rows] = await db.query(query, values);

//     if (!rows || rows.length === 0) {
//       return res.status(404).json({ message: "Visa applications not found for this processor" });
//     }

//     return res.status(200).json(rows);
//   } catch (error) {
//     console.error("Error fetching visa applications by processor:", error);
//     res.status(500).json({ message: "Internal server error", error: error.message });
//   }
// };




export const getVisaProcessByprocessorid = async (req, res) => {
  const { processor_id } = req.params;
  const filters = req.query;

  try {
    let query = `
      SELECT 
        vp.*,
        s.country,     -- ✅ student table se country
        u.name AS university_name,
        u.logo_url,
        u.location
      FROM visa_process vp
      LEFT JOIN students s ON vp.student_id = s.id   -- ✅ student join added
      LEFT JOIN universities u ON vp.university_id = u.id
      WHERE vp.processor_id = ?
    `;

    let conditions = [];
    let values = [processor_id];

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

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Visa applications not found for this processor" });
    }

    return res.status(200).json(rows);

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
      SELECT vp.* 
      FROM visa_process vp
      WHERE vp.counselor_id = ?
    `;

    let conditions = [];
    let values = [counselor_id];

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

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Visa applications not found for this counselor" });
    }

    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching visa applications by counselor:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};









