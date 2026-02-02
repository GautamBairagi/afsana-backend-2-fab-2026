// import db from '../config/db.js';
// import dotenv from 'dotenv';
// dotenv.config();

// import cloudinary from 'cloudinary';
// import fs from 'fs';

// cloudinary.config({
//   cloud_name: 'dkqcqrrbp',
//   api_key: '418838712271323',
//   api_secret: 'p12EKWICdyHWx8LcihuWYqIruWQ'
// });

// export const uploadDocuments = async (req, res) => {
//   const { student_id } = req.params;
//   const files = req.files;
//  const dateFields = [
//         "student_id" 
//     ];
//   const documentFields = ['passport', 'certificates', 'ielts', 'sop'];
//   const data = {};

//   try {
//     for (const field of documentFields) {
//       const file = files?.[field];
//       if (file && file.tempFilePath) {
//         try {
//           const result = await cloudinary.uploader.upload(file.tempFilePath, {
//             folder: 'student_application_docs',
//           });
//           data[field] = result.secure_url;
//           fs.unlinkSync(file.tempFilePath); // Clean up temp file
//         } catch (err) {
//           console.error(`Cloudinary upload error for ${field}:`, err);
//           return res.status(500).json({ success: false, message: `Upload failed for ${field}` });
//         }
//       }
//     }

//     // DB logic
//     const [existing] = await db.query('SELECT * FROM student_documents WHERE student_id = ?', [student_id]);

//     if (existing.length > 0) {
//       const updateFields = Object.keys(data).map(key => `${key} = ?`).join(', ');
//       const updateValues = Object.values(data);
//       updateValues.push(student_id);

//       await db.query(`UPDATE student_documents SET ${updateFields} WHERE student_id = ?`, updateValues);
//     } else {
//       await db.query(
//         `INSERT INTO student_documents (student_id, passport, certificates, ielts, sop)
//          VALUES (?, ?, ?, ?, ?)`,
//         [
//           student_id,
//           data.passport || null,
//           data.certificates || null,
//           data.ielts || null,
//           data.sop || null
//         ]
//       );
//     }

//     res.json({ success: true, message: 'Documents uploaded successfully', data });

//   } catch (err) {
//     console.error('Upload error:', err);
//     res.status(500).json({ success: false, message: 'Server error during upload' });
//   }
// };


// export const getDocuments = async (req, res) => {
//   const { student_id } = req.params;

//   try {
//     const [rows] = await db.query('SELECT * FROM student_documents WHERE student_id = ?', [student_id]);
//     if (rows.length === 0) {
//       return res.status(404).json({ success: false, message: 'No documents found' });
//     }

//     res.json({ success: true, data: rows[0] });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: 'Error fetching documents' });
//   }
// };


import db from '../config/db.js';
import dotenv from 'dotenv';
import cloudinary from 'cloudinary';
import fs from 'fs';
dotenv.config();

cloudinary.config({
    cloud_name: 'dkqcqrrbp',
    api_key: '418838712271323',
    api_secret: 'p12EKWICdyHWx8LcihuWYqIruWQ'
});

// export const uploadDocuments = async (req, res) => {
//     const { student_id } = req.params;
//     const files = req.files;

//     const documentFields = ['passport_copy_prepared', 'proof_of_income', 'birth_certificate', 'bank_statement', 'previous_studies_certificates'];
//     const data = {};

//     try {
//         if (!files || Object.keys(files).length === 0) {
//             return res.status(400).json({ success: false, message: 'No files were uploaded' });
//         }

//         // Upload each available file to Cloudinary
//         for (const field of documentFields) {
//             const file = files[field];
//             if (file && file.tempFilePath) {
//                 try {
//                     const result = await cloudinary.uploader.upload(file.tempFilePath, {
//                         folder: `student_application_docs/${student_id}`,
//                     });
//                     data[field] = result.secure_url;
//                     fs.unlinkSync(file.tempFilePath); // Delete temp file
//                 } catch (err) {
//                     console.error(`Cloudinary upload error for ${field}:`, err);
//                     return res.status(500).json({ success: false, message: `Upload failed for ${field}` });
//                 }
//             }
//         }

//         // Check if student already has a record
//         const [existing] = await db.query(
//             'SELECT * FROM student_documents WHERE student_id = ?',
//             [student_id]
//         );

//         if (existing.length > 0) {
//             // Update only fields provided
//             const updateFields = Object.keys(data).map(key => `${key} = ?`).join(', ');
//             const updateValues = [...Object.values(data), student_id];

//             await db.query(
//                 `UPDATE student_documents SET ${updateFields} WHERE student_id = ?`,
//                 updateValues
//             );
//         } else {
//             // Insert new row
//             await db.query(
//                 `INSERT INTO student_documents (student_id, 
// passport_copy_prepared,
// proof_of_income,
// birth_certificate,
// bank_statement,
// previous_studies_certificates)
//          VALUES (?, ?, ?, ?, ?, ?)`,
//                 [
//                     data.student_id,
//                     data.passport_copy_prepared || null,
//                     data.proof_of_income || null,
//                     data.birth_certificate || null,
//                     data.bank_statement || null,
//                     data.previous_studies_certificates || null
//                 ]
//             );
//         }

//         res.json({ success: true, message: 'Documents uploaded successfully', data });
//     } catch (err) {
//         console.error('Upload error:', err);
//         res.status(500).json({ success: false, message: 'Server error during upload' });
//     }
// };

// export const getDocuments = async (req, res) => {
//     const { student_id } = req.params;

//     try {
//         const [rows] = await db.query('SELECT * FROM student_documents WHERE student_id = ?', [student_id]);
//         if (rows.length === 0) {
//             return res.status(404).json({ success: false, message: 'No documents found for this student' });
//         }

//         res.json({ success: true, data: rows[0] });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ success: false, message: 'Error fetching documents' });
//     }
// };


export const uploadDocuments = async (req, res) => {
    const { student_id } = req.params;
    const files = req.files;

    const documentFields = [
        'passport_copy_prepared',
        'proof_of_income',
        'birth_certificate',
        'bank_statement',
        'previous_studies_certificates'
    ];

    const data = {};

    try {
        if (!files || Object.keys(files).length === 0) {
            return res.status(400).json({ success: false, message: 'No files were uploaded' });
        }

        // ✅ Upload each available file to Cloudinary
        for (const field of documentFields) {
            const file = files[field];
            if (file && file.tempFilePath) {
                try {
                    const result = await cloudinary.uploader.upload(file.tempFilePath, {
                        folder: `student_application_docs/${student_id}`,
                    });
                    data[field] = result.secure_url;
                    fs.unlinkSync(file.tempFilePath); // Delete temp file
                } catch (err) {
                    console.error(`Cloudinary upload error for ${field}:`, err);
                    return res.status(500).json({ success: false, message: `Upload failed for ${field}` });
                }
            }
        }

        // ✅ Check if student already has a record
        const [existing] = await db.query(
            'SELECT * FROM student_documents WHERE student_id = ?',
            [student_id]
        );

        if (existing.length > 0) {
            // ✅ Update only fields provided
            if (Object.keys(data).length > 0) {
                const updateFields = Object.keys(data).map(key => `${key} = ?`).join(', ');
                const updateValues = [...Object.values(data), student_id];

                await db.query(
                    `UPDATE student_documents SET ${updateFields}, updated_at = NOW() WHERE student_id = ?`,
                    updateValues
                );
            }
        } else {
            // ✅ Insert new row
            await db.query(
                `INSERT INTO student_documents (
                    student_id, 
                    passport_copy_prepared,
                    proof_of_income,
                    birth_certificate,
                    bank_statement,
                    previous_studies_certificates,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                    student_id, // ⚡ FIX: direct param se lena hai
                    data.passport_copy_prepared || null,
                    data.proof_of_income || null,
                    data.birth_certificate || null,
                    data.bank_statement || null,
                    data.previous_studies_certificates || null
                ]
            );
        }

        res.json({ success: true, message: 'Documents uploaded successfully', data });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ success: false, message: 'Server error during upload' });
    }
};

// ✅ Get Documents
export const getDocuments = async (req, res) => {
    const { student_id } = req.params;

    try {
        const [rows] = await db.query(
            'SELECT * FROM student_documents WHERE student_id = ?',
            [student_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'No documents found for this student' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('Fetch error:', err);
        res.status(500).json({ success: false, message: 'Error fetching documents' });
    }
};