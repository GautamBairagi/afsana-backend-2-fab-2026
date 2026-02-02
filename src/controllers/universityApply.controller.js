import db from '../config/db.js';
import { studentNameById } from '../models/student.model.js';
import { getCounselorById } from '../models/counselor.model.js';
import { universityNameById } from '../models/universities.model.js';
import { studentidentifying_name } from '../models/student.model.js';
import { processor_name } from '../models/student.model.js';




// import { getCounselorById } from '../models/counselor.model.js';



import cloudinary from "cloudinary";
import fs from 'fs';

cloudinary.config({
    cloud_name: 'dkqcqrrbp',
    api_key: '418838712271323',
    api_secret: 'p12EKWICdyHWx8LcihuWYqIruWQ'
});


// export const createApply = async (req, res) => {
//     const data = req.body;
//     const files = req.files;
//     console.log("Files received:", files);
//     // List of date fields
//     const dateFields = [
//       "registration_date",
//       "application_submission_date",
//       "university_interview_date",
//       "university_offer_letter_received",
//       "appointment_date",
//       "visa_interview_date",
//       "final_offer_letter"
//     ];
//     // Map file paths to fields
//     for (const key in files) {
//       if (files[key] && files[key][0]) {
//         data[key] = `/uploads/${files[key][0].filename}`;
//       }
//     }

//     // Convert empty strings to NULL for date fields and other fields
//     Object.keys(data).forEach((key) => {
//       if (data[key] === '') {
//         data[key] = null;
//       }

//       // If the field is a date field, validate the format
//       if (dateFields.includes(key) && data[key]) {
//         const dateValue = new Date(data[key]);
//         if (isNaN(dateValue.getTime())) {
//           data[key] = null;  // Invalid date, set to NULL
//         }
//       }
//     });

//     try {
//       const query = `INSERT INTO studentapplicationprocess SET ?`;
//       const [result] = await db.query(query, data);

//       res.status(201).json({ message: 'Record created successfully', id: result.insertId });
//     } catch (error) {
//       console.error('Error creating record:', error);
//       res.status(500).json({ message: 'Error creating record', error: error.message });
//     }
//   };

export const createApply = async (req, res) => {
    const data = req.body;
    const files = req.files;

    // console.log("Files received:", files);
    // List of date fields
    const dateFields = [
        "registration_date",
        "application_submission_date",
        "university_interview_date",
        "university_offer_letter_received",
        "appointment_date",
        "visa_interview_date",
        "final_offer_letter"
    ];

    // ✅ Upload files to Cloudinary and set public URLs
    for (const key in files) {
        const file = files[key];
        if (file && file.tempFilePath) {
            try {
                const result = await cloudinary.uploader.upload(file.tempFilePath, {
                    folder: "student_application_docs"
                });
                data[key] = result.secure_url; // Save Cloudinary file URL

            } catch (err) {
                console.error(`Cloudinary upload error for ${key}:`, err);
                return res.status(500).json({ message: `Upload failed for ${key}` });
            }
        }
    }

    // Convert empty strings to NULL
    Object.keys(data).forEach((key) => {
        if (data[key] === '') {
            data[key] = null;
        }

        // If the field is a date field, validate the format
        if (dateFields.includes(key) && data[key]) {
            const dateValue = new Date(data[key]);
            if (isNaN(dateValue.getTime())) {
                data[key] = null;
            }
        }
    });

    try {
        const query = `INSERT INTO studentapplicationprocess SET ?`;
        const [result] = await db.query(query, data);

        res.status(201).json({ message: 'Record created successfully', id: result.insertId });
    } catch (error) {
        console.error('Error creating record:', error);
        res.status(500).json({ message: 'Error creating record', error: error.message });
    }
};


// export const assignCounselor = async (req, res) => {
//     const { application_id, counselor_id } = req.body;

//     // Validate input
//     if (!application_id || !counselor_id) {
//         return res.status(400).json({ message: "Both 'application_id' and 'counselor_id' are required" });
//     }

//     try {
//         const query = `UPDATE studentapplicationprocess SET counselor_id = ? WHERE id = ?`;
//         const [result] = await db.query(query, [counselor_id, application_id]);

//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: "Application ID not found" });
//         }

//         res.status(200).json({ message: "Counselor assigned successfully" });
//     } catch (error) {
//         console.error("Error assigning counselor:", error);
//         res.status(500).json({ message: "Failed to assign counselor", error: error.message });
//     }
// };


export const assignCounselor = async (req, res) => {
    const { application_id, counselor_id, follow_up, notes } = req.body;

    // Check for required identifier
    if (!application_id) {
        return res.status(400).json({ message: "'application_id' is required" });
    }

    // Build dynamic fields
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
    // If nothing to update
    if (updates.length === 0) {
        return res.status(400).json({ message: "No fields provided to update" });
    }
    const query = `UPDATE studentapplicationprocess SET ${updates.join(", ")} WHERE id = ?`;
    values.push(application_id);
    try {
        const [result] = await db.query(query, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Application ID not found" });
        } else {
            const [findCounselorName] = await db.query(
                "SELECT full_name FROM users WHERE counselor_id = ?",
                [counselor_id]
            );
            const Cname = findCounselorName[0]?.full_name;
            await db.query(
                `INSERT INTO dashboard_notifications 
                 (counselor_id, student_id, sNotification, cNotification, message)
                 VALUES (?, ?, ?, ?, ?)`,
                [counselor_id, null, 0, 1, `Application assigned to counselor ${Cname}`]
            );

        }

        res.status(200).json({ message: "Application updated successfully" });
    } catch (error) {
        console.error("Error updating application:", error);
        res.status(500).json({ message: "Update failed", error: error.message });
    }
};




export const assignassignProcessorapllication = async (req, res) => {
    const { application_id, processor_id } = req.body;

    // Check for required identifier
    if (!application_id) {
        return res.status(400).json({ message: "'application_id' is required" });
    }

    // Build dynamic fields
    const updates = [];
    const values = [];

    if (processor_id !== undefined) {
        updates.push("processor_id = ?");
        values.push(processor_id);
    }

    // If nothing to update
    if (updates.length === 0) {
        return res.status(400).json({ message: "No fields provided to update" });
    }
    const query = `UPDATE studentapplicationprocess SET ${updates.join(", ")} WHERE id = ?`;
    values.push(application_id);
    try {
        const [result] = await db.query(query, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Application ID not found" });
        } else {
            const [findProcessorName] = await db.query(
                "SELECT full_name FROM users WHERE id = ?",
                [processor_id]
            );
            const Pname = findProcessorName[0]?.full_name;
            await db.query(
                `INSERT INTO dashboard_notifications 
                 (processor_id , counselor_id, student_id, sNotification, cNotification , pNotification , message)
                 VALUES (?, ?, ?, ?, ? , ? , ?)`,
                [processor_id, null, null, 0, 0, 1, `Application assigned to processor : ${Pname}`]
            );

        }

        res.status(200).json({ message: "Application updated successfully" });
    } catch (error) {
        console.error("Error updating application:", error);
        res.status(500).json({ message: "Update failed", error: error.message });
    }
};











// export const getApplicationsByCounselor = async (req, res) => {
//     const { counselor_id } = req.params;

//     try {
//         const query = `SELECT * FROM studentapplicationprocess WHERE counselor_id = ?`;
//         const [rows] = await db.query(query, [counselor_id]);

//         if (rows.length === 0) {
//             return res.status(404).json({ message: "No applications found for this counselor." });
//         }

//         res.status(200).json(rows);
//     } catch (error) {
//         console.error("Error fetching applications:", error);
//         res.status(500).json({ message: "Server error", error: error.message });
//     }
// };



export const getApplicationsByCounselor = async (req, res) => {
    const { counselor_id } = req.params;

    try {
        const query = `SELECT * FROM studentapplicationprocess WHERE counselor_id = ?`;
        const [applications] = await db.query(query, [counselor_id]);

        if (applications.length === 0) {
            return res.status(404).json({ message: "No applications found for this counselor." });
        }

        const baseUrl = "http://yourdomain.com/uploads/"; // Replace with your actual base URL
        const fileFields = [
            "fee_confirmation_document",
            "invoice_with_conditional_offer",
            "tuition_fee_transfer_proof",
            "final_university_offer_letter",
            "passport_copy_prepared"
            // Add all other file fields used in your schema
        ];
        const data = await Promise.all(
            applications.map(async (app) => {
                let studentName = '';
                let universityName = '';
                try {
                    const studentResult = await studentNameById(app.student_id);
                    const universityResult = await universityNameById(app.university_id);
                    studentName = studentResult[0]?.full_name || '';
                    universityName = universityResult[0]?.name || '';
                } catch (err) {
                    console.error(`Error fetching names for application ID ${app.id}:`, err);
                }

                // Update file paths with base URL
                fileFields.forEach((field) => {
                    if (app[field] !== null) {
                        if (!app[field].startsWith('http')) {
                            app[field] = `${baseUrl}${app[field]}`;
                        }
                    } else {
                        app[field] = null;
                    }
                });

                return {
                    ...app,
                    student_name: studentName,
                    university_name: universityName
                };
            })
        );

        res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching applications:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};




// export const getAllApplications = async (req, res) => {
//     try {
//         const query = `SELECT * FROM studentapplicationprocess`;
//         const [applications] = await db.query(query);

//         if (applications.length === 0) {
//             return res.status(404).json({ message: 'No applications found' });
//         }

//         const baseUrl = `${req.protocol}://${req.get('host')}`;

//         // Fields to update with base URL
//         const fileFields = [
//             'fee_confirmation_document',
//             'conditional_offer_letter',
//             'invoice_with_conditional_offer',
//             'tuition_fee_transfer_proof',
//             'final_university_offer_letter',
//             'passport_copy_prepared',
//             'financial_support_declaration',
//             'final_offer_letter',
//             'proof_of_relationship',
//             'english_language_proof',
//             'residence_permit_form',
//             'proof_of_income',
//             'airplane_ticket_booking',
//             'police_clearance_certificate',
//             'europass_cv',
//             'birth_certificate',
//             'bank_statement',
//             'accommodation_proof',
//             'motivation_letter',
//             'previous_studies_certificates',
//             'travel_insurance',
//             'european_photo',
//             'health_insurance'
//         ];

//         // Transform data
//         const data = await Promise.all(
//             applications.map(async (app) => {
//                 let studentName = '';
//                 let universityName = '';
//                 try {
//                     const studentResult = await studentNameById(app.student_id);
//                     const universityResult = await universityNameById(app.university_id);
//                     studentName = studentResult[0]?.full_name || '';
//                     universityName = universityResult[0]?.name || '';
//                 } catch (err) {
//                     console.error(`Error fetching student name for ID ${app.student_id}:`, err);
//                 }

//                 // Update file paths with base URL
//                 // fileFields.forEach((field) => {
//                 //     if (app[field] !== null) {
//                 //         app[field] = `${baseUrl}${app[field]}`;
//                 //     } else {
//                 //         app[field] = null; // Ensure the field is explicitly set to null
//                 //     }
//                 // });


//                 // Update file paths with base URL
//                 fileFields.forEach((field) => {
//                     if (app[field] !== null) {
//                         // Avoid prefixing full URLs (e.g., Cloudinary)
//                         if (!app[field].startsWith('http')) {
//                             app[field] = `${baseUrl}${app[field]}`;
//                         }
//                     } else {
//                         app[field] = null;
//                     }
//                 });
//                 return {
//                     ...app,
//                     student_name: studentName,
//                     university_name: universityName
//                 };
//             })
//         );

//         res.status(200).json(data);
//     } catch (error) {
//         console.error('Error fetching data:', error);
//         res.status(500).json({ message: 'Error fetching data', error: error.message });
//     }
// };


export const getAllApplications = async (req, res) => {
    try {
        const query = `SELECT * FROM studentapplicationprocess`;
        const [applications] = await db.query(query);

        if (applications.length === 0) {
            return res.status(404).json({ message: 'No applications found' });
        }

        const baseUrl = `${req.protocol}://${req.get('host')}`;

        const fileFields = [
            'fee_confirmation_document',
            'conditional_offer_letter',
            'invoice_with_conditional_offer',
            'tuition_fee_transfer_proof',
            'final_university_offer_letter',
            'passport_copy_prepared',
            'financial_support_declaration',
            'final_offer_letter',
            'proof_of_relationship',
            'english_language_proof',
            'residence_permit_form',
            'proof_of_income',
            'airplane_ticket_booking',
            'police_clearance_certificate',
            'europass_cv',
            'birth_certificate',
            'bank_statement',
            'accommodation_proof',
            'motivation_letter',
            'previous_studies_certificates',
            'travel_insurance',
            'european_photo',
            'health_insurance'
        ];

        const data = await Promise.all(
            applications.map(async (app) => {
                let studentName = '';
                let counselorName = '';
                let universityName = '';
                let processorName = '';

                try {
                    const [studentResult, counselorResult, universityResult, processorResult] = await Promise.all([
                        studentNameById(app.student_id),
                        getCounselorById(app?.counselor_id),
                        universityNameById(app.university_id),
                        processor_name(app?.processor_id)
                    ]);

                    studentName = studentResult[0]?.full_name || '';
                    counselorName = counselorResult[0]?.full_name || '';
                    universityName = universityResult[0]?.name || '';
                    processorName = processorResult[0]?.full_name || '';
                } catch (err) {
                    console.error(`Error fetching related data for application ID ${app.id}:`, err);
                }

                // Update file fields with full URL if not already full URLs
                fileFields.forEach((field) => {
                    if (app[field] !== null) {
                        if (!app[field].startsWith('http')) {
                            app[field] = `${baseUrl}${app[field]}`;
                        }
                    } else {
                        app[field] = null;
                    }
                });

                return {
                    ...app,
                    student_name: studentName,
                    counselor_name: counselorName,
                    university_name: universityName,
                    processor_name: processorName
                };
            })
        );

        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Error fetching data', error: error.message });
    }
};




export const getAllApplicationsById = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: 'Application ID is required' });
    }

    try {
        const query = `SELECT * FROM studentapplicationprocess WHERE id = ?`;
        const [applications] = await db.query(query, [id]);

        if (applications.length === 0) {
            return res.status(404).json({ message: 'No applications found for the given ID' });
        }

        const baseUrl = `${req.protocol}://${req.get('host')}`;

        const fileFields = [
            'fee_confirmation_document',
            'conditional_offer_letter',
            'invoice_with_conditional_offer',
            'tuition_fee_transfer_proof',
            'final_university_offer_letter',
            'passport_copy_prepared',
            'financial_support_declaration',
            'final_offer_letter',
            'proof_of_relationship',
            'english_language_proof',
            'residence_permit_form',
            'proof_of_income',
            'airplane_ticket_booking',
            'police_clearance_certificate',
            'europass_cv',
            'birth_certificate',
            'bank_statement',
            'accommodation_proof',
            'motivation_letter',
            'previous_studies_certificates',
            'travel_insurance',
            'european_photo',
            'health_insurance'
        ];

        const data = await Promise.all(
            applications.map(async (app) => {
                let studentName = '';
                let universityName = '';
                let studentidentifyname = '';


                try {
                    const studentResult = await studentNameById(app.student_id);
                    const universityResult = await universityNameById(app.university_id);
                    const studentResultstudentidentifying_name = await studentidentifying_name(app.student_id);

                    studentName = studentResult[0]?.full_name || '';
                    studentidentifyname = studentResultstudentidentifying_name[0]?.identifying_name || '';
                    universityName = universityResult[0]?.name || '';
                } catch (err) {
                    console.error(`Error fetching related data for ID ${id}:`, err);
                }
                // Update file paths with base URL
                // fileFields.forEach((field) => {
                //     if (app[field]) {
                //         app[field] = `${baseUrl}${app[field]}`;
                //     }
                // }); 
                fileFields.forEach((field) => {
                    if (app[field] !== null) {
                        // Avoid prefixing full URLs (e.g., Cloudinary)
                        if (!app[field].startsWith('http')) {
                            app[field] = `${baseUrl}${app[field]}`;
                        }
                    } else {
                        app[field] = null;
                    }
                });
                return {
                    ...app,
                    student_name: studentName,
                    identify_name: studentidentifyname,
                    university_name: universityName

                };
            })
        );

        res.status(200).json(data[0]); // Return the first (and only) record
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Error fetching data', error: error.message });
    }
};

export const getAplicationBYStudentID = async (req, res) => {
    console.log("req ", req.params);
    const studentId = req.params.studentId;
    try {
        const query = `SELECT * FROM studentapplicationprocess WHERE student_id = ?`;
        const [applications] = await db.query(query, [studentId]);

        if (applications.length === 0) {
            return res.status(404).json({ message: 'No applications found for the given student ID' });
        }

        const baseUrl = `${req.protocol}://${req.get('host')}`;

        // Fields to update with base URL
        const fileFields = [
            'fee_confirmation_document',
            'conditional_offer_letter',
            'invoice_with_conditional_offer',
            'tuition_fee_transfer_proof',
            'final_university_offer_letter',
            'passport_copy_prepared',
            'financial_support_declaration',
            'final_offer_letter',
            'proof_of_relationship',
            'english_language_proof',
            'residence_permit_form',
            'proof_of_income',
            'airplane_ticket_booking',
            'police_clearance_certificate',
            'europass_cv',
            'birth_certificate',
            'bank_statement',
            'accommodation_proof',
            'motivation_letter',
            'previous_studies_certificates',
            'travel_insurance',
            'european_photo',
            'health_insurance'
        ];

        // Transform data
        const data = await Promise.all(
            applications.map(async (app) => {
                let studentName = '';
                let universityName = '';
                try {
                    const studentResult = await studentNameById(app.student_id);
                    const universityResult = await universityNameById(app.university_id);
                    studentName = studentResult[0]?.full_name || '';
                    universityName = universityResult[0]?.name || '';
                } catch (err) {
                    console.error(`Error fetching student name for ID ${app.student_id}:`, err);
                }

                // Update file paths with base URL
                fileFields.forEach((field) => {
                    if (app[field]) {
                        app[field] = `${baseUrl}${app[field]}`;
                    }
                });

                return {
                    ...app,
                    student_name: studentName,
                    university_name: universityName
                };
            })
        );

        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Error fetching data', error: error.message });
    }
};



export const getAplicationBYProcessorID = async (req, res) => {
    console.log("req ", req.params);
    const processorId = req.params.processorId;
    try {
        const query = `SELECT * FROM studentapplicationprocess WHERE processor_id = ?`;
        const [applications] = await db.query(query, [processorId]);

        if (applications.length === 0) {
            return res.status(404).json({ message: 'No applications found for the given student ID' });
        }

        const baseUrl = `${req.protocol}://${req.get('host')}`;

        // Fields to update with base URL
        const fileFields = [
            'fee_confirmation_document',
            'conditional_offer_letter',
            'invoice_with_conditional_offer',
            'tuition_fee_transfer_proof',
            'final_university_offer_letter',
            'passport_copy_prepared',
            'financial_support_declaration',
            'final_offer_letter',
            'proof_of_relationship',
            'english_language_proof',
            'residence_permit_form',
            'proof_of_income',
            'airplane_ticket_booking',
            'police_clearance_certificate',
            'europass_cv',
            'birth_certificate',
            'bank_statement',
            'accommodation_proof',
            'motivation_letter',
            'previous_studies_certificates',
            'travel_insurance',
            'european_photo',
            'health_insurance'
        ];










        // Transform data
        const data = await Promise.all(
            applications.map(async (app) => {
                let studentName = '';
                let universityName = '';
                let ProcessorName = '';
                let counselorName = '';
                let studentidentifyname = '';
                try {
                    const studentResult = await studentNameById(app.student_id);
                    const universityResult = await universityNameById(app.university_id);
                    const ProcessorNameResult = await processor_name(app.processor_id);
                    const counselorResult = await getCounselorById(app.counselor_id);
                    const studentResultstudentidentifying_name = await studentidentifying_name(app.student_id);
                    studentName = studentResult[0]?.full_name || '';
                    universityName = universityResult[0]?.name || '';
                    ProcessorName = ProcessorNameResult[0]?.full_name || '';
                    counselorName = counselorResult[0]?.full_name || '';
                    studentidentifyname = studentResultstudentidentifying_name[0]?.identifying_name || '';
                } catch (err) {
                    console.error(`Error fetching student name for ID ${app.student_id}:`, err);
                }

                // Update file paths with base URL
                fileFields.forEach((field) => {
                    if (app[field]) {
                        app[field] = `${baseUrl}${app[field]}`;
                    }
                });

                return {
                    ...app,
                    student_name: studentName,
                    university_name: universityName,
                    processor_name: ProcessorName,
                    counselor_name: counselorName,
                    studentidentify_name: studentidentifyname
                };
            })
        );

        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Error fetching data', error: error.message });
    }
};




export const getApplicationByStudentAndUniversity = async (req, res) => {
    const { studentId, universityId } = req.params;

    try {
        const query = `SELECT * FROM studentapplicationprocess WHERE student_id = ? AND university_id = ?`;
        const [applications] = await db.query(query, [studentId, universityId]);

        if (applications.length === 0) {
            return res.status(404).json({ status: false, message: 'No applications found for the given student and university ID' });
        }

        // const baseUrl = `${req.protocol}://${req.get('host')}`;

        // Fields to update with base URL
        const fileFields = [
            'fee_confirmation_document',
            'conditional_offer_letter',
            'invoice_with_conditional_offer',
            'tuition_fee_transfer_proof',
            'final_university_offer_letter',
            'passport_copy_prepared',
            'financial_support_declaration',
            'final_offer_letter',
            'proof_of_relationship',
            'english_language_proof',
            'residence_permit_form',
            'proof_of_income',
            'airplane_ticket_booking',
            'police_clearance_certificate',
            'europass_cv',
            'birth_certificate',
            'bank_statement',
            'accommodation_proof',
            'motivation_letter',
            'previous_studies_certificates',
            'travel_insurance',
            'european_photo',
            'health_insurance'
        ];

        // Transform data
        const data = await Promise.all(
            applications.map(async (app) => {
                let studentName = '';
                let universityName = '';

                try {
                    const studentResult = await studentNameById(app.student_id);
                    const universityResult = await universityNameById(app.university_id);

                    studentName = studentResult[0]?.full_name || '';
                    universityName = universityResult[0]?.name || '';
                } catch (err) {
                    console.error(`Error fetching student/university name for student_id ${app.student_id} and university_id ${app.university_id}:`, err);
                }

                // Update file paths with base URL
                fileFields.forEach((field) => {
                    if (app[field]) {
                        app[field] = `${app[field]}`;
                    }
                });

                return {
                    ...app,
                    student_name: studentName,
                    university_name: universityName
                };
            })
        );

        res.status(200).json({ status: true, data });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Error fetching data', error: error.message });
    }
};

// export const updateApply = async (req, res) => {
//     const { id } = req.params;
//     const data = req.body;
//     const files = req.files;

//     console.log("Files received for update:", files);

//     // List of date fields
//     const dateFields = [
//       "registration_date",
//       "application_submission_date",
//       "university_interview_date",
//       "university_offer_letter_received",
//       "appointment_date",
//       "visa_interview_date",

//     ];

//     // Map file paths to fields
//     for (const key in files) {
//       if (files[key] && files[key][0]) {
//         data[key] = `/uploads/${files[key][0].filename}`;
//       }
//     }

//     // Convert empty strings to NULL and validate date fields
//     Object.keys(data).forEach((key) => {
//       if (data[key] === '') {
//         data[key] = null;
//       }

//       // Validate date fields
//       if (dateFields.includes(key) && data[key]) {
//         const dateValue = new Date(data[key]);
//         if (isNaN(dateValue.getTime())) {
//           data[key] = null;  // Invalid date, set to NULL
//         }
//       }
//     });

//     try {
//       const fieldsToUpdate = Object.keys(data).map((key) => `${key} = ?`).join(', ');
//       const values = Object.values(data);

//       const query = `UPDATE studentapplicationprocess SET ${fieldsToUpdate} WHERE id = ?`;
//       values.push(id);

//       const [result] = await db.query(query, values);

//       if (result.affectedRows === 0) {
//         return res.status(404).json({ message: 'Record not found or no changes made' });
//       }

//       res.status(200).json({ message: 'Record updated successfully' });
//     } catch (error) {
//       console.error('Error updating record:', error);
//       res.status(500).json({ message: 'Error updating record', error: error.message });
//     }
//   };





export const updateApply = async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const files = req.files;
    console.log("Files received for update:", files);
    // List of date fields
    const dateFields = [
        "registration_date",
        "application_submission_date",
        "university_interview_date",
        "university_offer_letter_received",
        "appointment_date",
        "visa_interview_date",
    ];

    for (const key in files) {
        const file = files[key];
        if (file && file.tempFilePath) {
            try {
                const result = await cloudinary.uploader.upload(file.tempFilePath, {
                    folder: "student_application_docs"
                });
                data[key] = result.secure_url; // Set the new URL
                fs.unlinkSync(file.tempFilePath); // ❌ Delete local temp file
            } catch (err) {
                console.error(`Cloudinary upload error for ${key}:`, err);
                return res.status(500).json({ message: `Upload failed for ${key}` });
            }
        }
    }

    // Convert empty strings to NULL
    Object.keys(data).forEach((key) => {
        if (data[key] === '') {
            data[key] = null;
        }
        // If the field is a date field, validate the format
        if (dateFields.includes(key) && data[key]) {
            const dateValue = new Date(data[key]);
            if (isNaN(dateValue.getTime())) {
                data[key] = null;
            }
        }
    });
    try {
        const query = `UPDATE studentapplicationprocess SET ? WHERE id = ?`;
        const [result] = await db.query(query, [data, id]);

        res.status(200).json({ message: 'Record updated successfully' });
    } catch (error) {
        console.error('Error updating record:', error);
        res.status(500).json({ message: 'Error updating record', error: error.message });
    }
};




export const deleteApply = async (req, res) => {
    const { id } = req.params;
    console.log("req.partam :", id);
    try {
        const query = `DELETE FROM studentapplicationprocess WHERE id = ?`;
        const [result] = await db.query(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Record not found' });
        }

        res.status(200).json({ message: 'Record deleted successfully' });
    } catch (error) {
        console.error('Error deleting record:', error);
        res.status(500).json({ message: 'Error deleting record', error: error.message });
    }
};

export const updateStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const query = `UPDATE studentapplicationprocess SET status = ? WHERE id = ?`;
        const [result] = await db.query(query, [status, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Record not found' });
        }

        res.status(200).json({ message: 'Record updated successfully' });
    } catch (error) {
        console.error('Error updating record:', error);
        res.status(500).json({ message: 'Error updating record', error: error.message });
    }
};

