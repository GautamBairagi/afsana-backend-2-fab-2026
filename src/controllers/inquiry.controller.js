import db from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config();
import cloudinary from "cloudinary";
import fs from 'fs';
import nodemailer from "nodemailer";

cloudinary.config({
  cloud_name: 'dkqcqrrbp',
  api_key: '418838712271323',
  api_secret: 'p12EKWICdyHWx8LcihuWYqIruWQ'
});

export const uploadDocuments = async (req, res) => {
  const { id } = req.params;
  const files = req.files;

  try {
    const [existing] = await db.query('SELECT id FROM inquiries WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    const uploads = {};

    const uploadToCloudinary = async (fileBuffer, folderName) => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: `inquiries/${folderName}`, resource_type: 'auto' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        ).end(fileBuffer);
      });
    };

    if (files?.passport) {
      uploads.passport = await uploadToCloudinary(files.passport[0].buffer, 'passport');
    }
    if (files?.certificates) {
      uploads.certificates = await uploadToCloudinary(files.certificates[0].buffer, 'certificates');
    }
    if (files?.ielts) {
      uploads.ielts = await uploadToCloudinary(files.ielts[0].buffer, 'ielts');
    }
    if (files?.sop) {
      uploads.sop = await uploadToCloudinary(files.sop[0].buffer, 'sop');
    }

    if (Object.keys(uploads).length === 0) {
      return res.status(400).json({ message: 'No files provided for update' });
    }

    const updateFields = Object.keys(uploads).map(field => `${field} = ?`).join(', ');
    const values = Object.values(uploads);

    await db.query(
      `UPDATE inquiries SET ${updateFields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [...values, id]
    );

    res.status(200).json({ message: 'Documents uploaded and inquiry updated successfully' });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const createInquiry = async (req, res) => {
  const {
    counselor_id, inquiry_type, source, branch, full_name, phone_number, email,
    course_name, country, city, date_of_birth, gender, medium, study_level, study_field,
    intake, budget, consent, highest_level, ssc, hsc, bachelor, university, test_type, test_name, overall_score, reading_score, writing_score, speaking_score, listening_score, date_of_inquiry, address, present_address, additionalNotes,
    study_gap, visa_refused, refusal_reason, education_background, english_proficiency, company_name, job_title,
    job_duration, preferred_countries, priority
  } = req.body;
  console.log("req.body ", req.body);
  try {

     const [checkPhone] = await db.query(
      `SELECT id FROM inquiries WHERE phone_number = ?`,
      [phone_number]
    );

    if (checkPhone.length > 0) {
      return res.status(400).json({
        success: false,
        message: "This phone number already exists. Please use a different number"
      });
    }

    const formattedCounselorId = (counselor_id === "undefined" || counselor_id === undefined) ? null : counselor_id;
    const [result] = await db.query(
      `INSERT INTO inquiries 
        (counselor_id, inquiry_type, source, branch, full_name, phone_number, email, 
         course_name, country, city, date_of_birth, gender, medium, study_level, study_field,
    intake, budget, consent,  highest_level, ssc, hsc ,bachelor ,university , test_type, test_name, overall_score, reading_score, writing_score, speaking_score, listening_score,   date_of_inquiry, address, present_address, additionalNotes ,
        study_gap, visa_refused, refusal_reason, education_background, english_proficiency, company_name, job_title, 
         job_duration, preferred_countries, lead_status,payment_status, assignment_description, priority)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?);`,
      [
        formattedCounselorId, inquiry_type, source, branch, full_name, phone_number, email,
        course_name, country, city, date_of_birth, gender, medium, study_level, study_field,
        intake, budget, consent, highest_level, ssc, hsc, bachelor, university, test_type, test_name, overall_score, reading_score, writing_score, speaking_score, listening_score, date_of_inquiry, address, present_address, additionalNotes, study_gap, visa_refused, refusal_reason,
        JSON.stringify(education_background), JSON.stringify(english_proficiency),
        company_name, job_title, job_duration, JSON.stringify(preferred_countries), priority
      ]
    );

    const [counselors] = await db.query(`SELECT id FROM users WHERE role = 'counselor'`);

    const counselorIds = counselors.map(c => c.id).join(','); // "1,2,3,4"

    const [notify] = await db.query(`
  INSERT INTO notifications (type, related_id, message, counselor_id, student_id)
  VALUES (?, ?, ?, ?, ?)`,
      ['new_inquiry', result?.insertId, `A new inquiry  has been created.`, counselorIds, null]
    );

    const [staffget] = await db.query(`SELECT id FROM staff WHERE  branch = ?`, [branch]);
    console.log("staffget", staffget);
    const data = staffget.map(c => c.id);
    console.log("datastaffmap", data);

    //   if (result) {
    //     const [notifyData] = await db.query(`
    // INSERT INTO dashboard_notifications (counselor_id, student_id, staff_id, staffNotification, sNotification , cNotification  , message )
    // VALUES (?, ?, ?, ?, ?, ?, ?)`,
    //       [null, null, data, 1, 0, 0, `A new inquiry ${full_name} , inquiry_type: ${inquiry_type} has been created.`]
    //     );
    //     console.log("notifyData", notifyData);
    //   }


    if (result) {
      for (let staff_id of data) {
        await db.query(
          `INSERT INTO dashboard_notifications (counselor_id, student_id, staff_id, staffNotification, sNotification , cNotification  , message )
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [null, null, staff_id, 1, 0, 0, `A new inquiry ${full_name}, inquiry_type: ${inquiry_type} has been created.`]
        );
      }
      console.log("Notifications inserted for all staff IDs");
    }




    console.log("notify", notify);

    res.status(201).json({ message: 'Inquiry created successfully', inquiryId: result.insertId });
  } catch (err) {
    console.error('Create Inquiry error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};


export const updateInquiry = async (req, res) => {
  const { id } = req.params;

  const {
    counselor_id, inquiry_type, source, branch, full_name, phone_number, email,
    course_name, country, city, date_of_birth, gender, medium, study_level, study_field,
    intake, budget, consent, highest_level, ssc, hsc, bachelor, university, test_type,
    test_name, overall_score, reading_score, writing_score, speaking_score, listening_score,
    date_of_inquiry, address, present_address, additionalNotes,
    study_gap, visa_refused, refusal_reason, education_background, english_proficiency,
    company_name, job_title, job_duration, preferred_countries, priority
  } = req.body;

  try {
    // ------------------------------------------------------------------
    // 1️⃣ CHECK IF INQUIRY EXISTS
    // ------------------------------------------------------------------
    const [existing] = await db.query(`SELECT id FROM inquiries WHERE id = ?`, [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Inquiry not found" });
    }

    // ------------------------------------------------------------------
    // 2️⃣ PHONE NUMBER DUPLICATE CHECK (EXCEPT OWN RECORD)
    // ------------------------------------------------------------------
    const [checkPhone] = await db.query(
      `SELECT id FROM inquiries WHERE phone_number = ? AND id != ?`,
      [phone_number, id]
    );

    if (checkPhone.length > 0) {
      return res.status(400).json({
        success: false,
        message: "This phone number already exists. Please use a different number",
      });
    }

    // ------------------------------------------------------------------
    // 3️⃣ FORMAT counselor_id IF undefined
    // ------------------------------------------------------------------
    const formattedCounselorId =
      counselor_id === "undefined" || counselor_id === undefined ? null : counselor_id;

    // ------------------------------------------------------------------
    // 4️⃣ UPDATE QUERY
    // ------------------------------------------------------------------
    const [updateResult] = await db.query(
      `UPDATE inquiries SET
          counselor_id = ?, inquiry_type = ?, source = ?, branch = ?, full_name = ?, phone_number = ?, email = ?, 
          course_name = ?, country = ?, city = ?, date_of_birth = ?, gender = ?, medium = ?, study_level = ?, study_field = ?,
          intake = ?, budget = ?, consent = ?, highest_level = ?, ssc = ?, hsc = ?, bachelor = ?, university = ?, 
          test_type = ?, test_name = ?, overall_score = ?, reading_score = ?, writing_score = ?, speaking_score = ?, listening_score = ?, 
          date_of_inquiry = ?, address = ?, present_address = ?, additionalNotes = ?, study_gap = ?, visa_refused = ?, 
          refusal_reason = ?, education_background = ?, english_proficiency = ?, company_name = ?, job_title = ?, 
          job_duration = ?, preferred_countries = ?, priority = ?
        WHERE id = ?`,
      [
        formattedCounselorId, inquiry_type, source, branch, full_name, phone_number, email,
        course_name, country, city, date_of_birth, gender, medium, study_level, study_field,
        intake, budget, consent, highest_level, ssc, hsc, bachelor, university, test_type,
        test_name, overall_score, reading_score, writing_score, speaking_score, listening_score,
        date_of_inquiry, address, present_address, additionalNotes, study_gap, visa_refused,
        refusal_reason, JSON.stringify(education_background),
        JSON.stringify(english_proficiency),
        company_name, job_title, job_duration,
        JSON.stringify(preferred_countries), priority,
        id
      ]
    );

    // ------------------------------------------------------------------
    // 5️⃣ INSERT NOTIFICATIONS FOR COUNSELORS
    // ------------------------------------------------------------------
    // const [counselors] = await db.query(`SELECT id FROM users WHERE role = 'counselor'`);
    // const counselorIds = counselors.map(c => c.id).join(",");

    // await db.query(
    //   `INSERT INTO notifications (type, related_id, message, counselor_id, student_id)
    //    VALUES (?, ?, ?, ?, ?)`,
    //   [
    //     'inquiry_update',
    //     id,
    //     `Inquiry (${full_name}) has been updated.`,
    //     counselorIds,
    //     null
    //   ]
    // );

    // ------------------------------------------------------------------
    // 6️⃣ STAFF NOTIFICATION (BRANCH-WISE)
    // ------------------------------------------------------------------
    // const [staffList] = await db.query(`SELECT id FROM staff WHERE branch = ?`, [branch]);
    // for (let staff of staffList) {
    //   await db.query(
    //     `INSERT INTO dashboard_notifications 
    //        (counselor_id, student_id, staff_id, staffNotification, sNotification, cNotification, message)
    //      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    //     [
    //       null,
    //       null,
    //       staff.id,
    //       1,
    //       0,
    //       0,
    //       `Inquiry ${full_name} has been updated.`
    //     ]
    //   );
    // }

    res.status(200).json({ success: true, message: "Inquiry updated successfully" });

  } catch (error) {
    console.error("Update Inquiry Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


export const getInquiryById = async (req, res) => {
  const { id } = req.params;

  try {
    const [results] = await db.query('SELECT * FROM inquiries WHERE id = ?', [id]);

    if (results.length === 0) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    // Parse JSON fields
    const inquiry = {
      ...results[0],
      education_background: JSON.parse(results[0].education_background),
      english_proficiency: JSON.parse(results[0].english_proficiency),
      preferred_countries: JSON.parse(results[0].preferred_countries),
    };

    res.json(inquiry);
  } catch (err) {
    console.error('Get Inquiry error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCheckEligiblity = async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await db.query('SELECT * FROM inquiries WHERE id = ?', [id]);

    if (results.length === 0) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    // Parse JSON fields
    const inquiry = {
      ...results[0],
      education_background: JSON.parse(results[0].education_background),
      english_proficiency: JSON.parse(results[0].english_proficiency),
      preferred_countries: JSON.parse(results[0].preferred_countries),
    };

    res.json(inquiry);
  } catch (err) {
    console.error('Get Inquiry error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateEligibilityStatus = async (req, res) => {
  const { id } = req.params;
  const { eligibility_status } = req.body;

  // Validate input: allow only 0 or 1
  if (![0, 1, 2, 3].includes(Number(eligibility_status))) {
    return res.status(400).json({ message: "eligibility_status must be 0 1, 2 or 3" });
  }

  try {
    const query = "UPDATE inquiries SET eligibility_status = ? WHERE id = ?";
    const [result] = await db.query(query, [eligibility_status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    res.status(200).json({ message: "Eligibility status updated successfully" });
  } catch (error) {
    console.error("Error updating eligibility status:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// export const updateInquiry = async (req, res) => {
//   const { id } = req.params;
//   const {
//     counselor_id, inquiry_type, source, branch, full_name, phone_number, email,
//     course_name, country, city, date_of_inquiry, address, present_address,
//     education_background, english_proficiency, company_name, job_title,
//     job_duration, preferred_countries
//   } = req.body;

//   try {
//     const [result] = await db.query(
//       `UPDATE inquiries 
//         SET counselor_id = ?, inquiry_type = ?, source = ?, branch = ?, full_name = ?, 
//             phone_number = ?, email = ?, course_name = ?, country = ?, city = ?, 
//             date_of_inquiry = ?, address = ?, present_address = ?, 
//             education_background = ?, english_proficiency = ?, 
//             company_name = ?, job_title = ?, job_duration = ?, 
//             preferred_countries = ?, updated_at = CURRENT_TIMESTAMP 
//         WHERE id = ?`,
//       [
//         counselor_id, inquiry_type, source, branch, full_name, phone_number, email,
//         course_name, country, city, date_of_inquiry, address, present_address,
//         JSON.stringify(education_background), JSON.stringify(english_proficiency),
//         company_name, job_title, job_duration, JSON.stringify(preferred_countries),
//         id
//       ]
//     );

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ message: 'Inquiry not found' });
//     }

//     res.json({ message: 'Inquiry updated successfully' });
//   } catch (err) {
//     console.error('Update Inquiry error:', err);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };

export const deleteInquiry = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM inquiries WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    res.json({ message: 'Inquiry deleted successfully' });
  } catch (err) {
    console.error('Delete Inquiry error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};



export const getAllInquiries = async (req, res) => {
  try {
    const { branch, created_at } = req.query; // e.g. ?branch=Sylhet&created_at=2025-10-07
    const timeZone = '+05:30'; // India Standard Time (IST)

    let query = `
      SELECT i.*, u.full_name AS counselor_name
      FROM inquiries i
      LEFT JOIN users u ON i.counselor_id = u.counselor_id
    `;

    const params = [];
    const conditions = [];

    if (branch && branch !== 'Both') {
      conditions.push(`i.branch = ?`);
      params.push(branch);
    } else if (branch === 'Both') {
      // When branch=Both, show both Sylhet and Dhaka data
      conditions.push(`i.branch IN (?, ?)`);
      params.push('Sylhet', 'Dhaka');
    }

    // ✅ Filter by created_at date (IST)
    if (created_at) {
      conditions.push(`DATE(CONVERT_TZ(i.created_at, '+00:00', ?)) >= ?`);
      params.push(timeZone, created_at);
    }

    // ✅ Append WHERE if conditions exist
    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY i.created_at ASC`; // Oldest first

    const [results] = await db.query(query, params);

    // ✅ Parse JSON safely and handle test_type logic
    const inquiries = results.map(inquiry => {
      const parsed = {
        ...inquiry,
        education_background: JSON.parse(inquiry.education_background || '[]'),
        english_proficiency: JSON.parse(inquiry.english_proficiency || '[]'),
        preferred_countries: JSON.parse(inquiry.preferred_countries || '[]'),
      };

      // ✅ If test_type = "OtherText", hide unnecessary score fields
      if (inquiry.test_type === 'OtherText') {
        delete parsed.overall_score;
        delete parsed.reading_score;
        delete parsed.writing_score;
        delete parsed.speaking_score;
        delete parsed.listening_score;
      }

      return parsed;
    });

    res.json(inquiries);
  } catch (err) {
    console.error('Get All Inquiries error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const assignInquiry = async (req, res) => {
  const { inquiry_id, counselor_id, follow_up_date, notes } = req.body;

  // Validation
  if (!inquiry_id || !counselor_id) {
    return res.status(400).json({ message: 'inquiry_id and counselor_id are required' });
  }
  try {
    const [result] = await db.query(
      `UPDATE inquiries
       SET counselor_id = ?, 
           status = 1, 
           follow_up_date = ?, 
           notes = ? 
       WHERE id = ?`,
      [counselor_id, follow_up_date || null, notes || null, inquiry_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Inquiry not found' });
    } else {
      const [findCounselorName] = await db.query("SELECT full_name FROM users WHERE counselor_id = ? ", [counselor_id])
      const name = findCounselorName[0]?.full_name
      const [notifyData] = await db.query(`
  INSERT INTO dashboard_notifications (counselor_id, student_id, cNotification , sNotification  , message )
  VALUES (?, ?, ?, ?, ?)`,
        [counselor_id, null, 1, 0, `Inquiry assined to ${name}`]
      );
      console.log("notifyData", notifyData);
    }

    res.status(200).json({ message: 'Inquiry assigned successfully, status updated, and follow-up info saved' });
  } catch (error) {
    console.error('Error assigning inquiry:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateInquiryPriority = async (req, res) => {
  const { inquiry_id, priority } = req.body;

  try {
    const [result] = await db.query(
      `UPDATE inquiries
       SET priority = ?, updated_at = NOW()
       WHERE id = ?`,
      [priority, inquiry_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    res.status(200).json({
      message: "Inquiry priority updated successfully"
    });

  } catch (error) {
    console.error("Error updating inquiry priority:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};








// export const getAllConvertedLeads = async (req, res) => {
//   try {
//     const { branch, created_at } = req.query;
//     const timeZone = '+05:30'; // India Standard Time (IST)

//     let query = `
//       SELECT 
//         i.*, 
//         u.full_name AS counselor_name,
//         (
//           SELECT fh.next_followup_date 
//           FROM followuphistory fh 
//           WHERE fh.inquiry_id = i.id 
//           ORDER BY fh.id DESC 
//           LIMIT 1
//         ) AS next_followup_date,
//         (
//           SELECT fh.date 
//           FROM followuphistory fh 
//           WHERE fh.inquiry_id = i.id 
//           ORDER BY fh.id DESC 
//           LIMIT 1
//         ) AS last_followup_date
//       FROM inquiries i
//       LEFT JOIN users u ON i.counselor_id = u.counselor_id
//       WHERE i.lead_status = 'Converted to Lead'
//     `;

//     const params = [];
//     const conditions = [];

//     // ✅ Branch filter (with “Both” logic)
//     if (branch && branch !== 'Both') {
//       conditions.push(`i.branch = ?`);
//       params.push(branch);
//     } else if (branch === 'Both') {
//       conditions.push(`i.branch IN (?, ?)`);
//       params.push('Sylhet', 'Dhaka');
//     }

//     // ✅ Created_at filter (with timezone)
//     if (created_at) {
//       conditions.push(`DATE(CONVERT_TZ(i.created_at, '+00:00', ?)) >= ?`);
//       params.push(timeZone, created_at);
//     }

//     // ✅ Add dynamic filters if exist
//     if (conditions.length > 0) {
//       query += ' AND ' + conditions.join(' AND ');
//     }

//     // ✅ Order by created date ascending
//     query += ' ORDER BY i.created_at ASC';

//     const [results] = await db.query(query, params);

//     if (results.length === 0) {
//       return res.status(404).json({ message: 'No converted leads found' });
//     }

//     res.status(200).json(results);

//   } catch (error) {
//     console.error("Error fetching converted leads:", error);
//     res.status(500).json({ message: 'Server error', error });
//   }
// };

// export const getAllConvertedLeads = async (req, res) => {
//   try {
//     const { branch, created_at } = req.query;
//     const timeZone = '+05:30'; // India Standard Time (IST)

//     let query = `
//       SELECT 
//         i.*, 
//         u.full_name AS counselor_name,
//         (
//           SELECT DATE(CONVERT_TZ(fh.next_followup_date, '+00:00', ?))
//           FROM followuphistory fh 
//           WHERE fh.inquiry_id = i.id 
//           ORDER BY fh.created_at DESC, fh.id DESC 
//           LIMIT 1
//         ) AS next_followup_date,
//         (
//           SELECT DATE(CONVERT_TZ(fh.last_followup_date, '+00:00', ?))
//           FROM followuphistory fh 
//           WHERE fh.inquiry_id = i.id 
//           ORDER BY fh.created_at DESC, fh.id DESC 
//           LIMIT 1
//         ) AS last_followup_date
//       FROM inquiries i
//       LEFT JOIN users u ON i.counselor_id = u.counselor_id
//       WHERE i.lead_status = 'Converted to Lead'
//     `;

//     const params = [timeZone, timeZone];
//     const conditions = [];

//     // ✅ Branch filter (with “Both” logic)
//     if (branch && branch !== 'Both') {
//       conditions.push(`i.branch = ?`);
//       params.push(branch);
//     } else if (branch === 'Both') {
//       conditions.push(`i.branch IN (?, ?)`); 
//       params.push('Sylhet', 'Dhaka');
//     }

//     // ✅ Created_at filter (from inquiries)
//     if (created_at) {
//       conditions.push(`DATE(CONVERT_TZ(i.created_at, '+00:00', ?)) >= ?`);
//       params.push(timeZone, created_at);
//     }

//     // ✅ Add conditions if any
//     if (conditions.length > 0) {
//       query += ' AND ' + conditions.join(' AND ');
//     }

//     // ✅ Order by created_at ascending
//     query += ' ORDER BY i.created_at ASC';

//     // ✅ Execute query
//     const [results] = await db.query(query, params);

//     if (results.length === 0) {
//       return res.status(404).json({ message: 'No converted leads found' });
//     }

//     res.status(200).json(results);

//   } catch (error) {
//     console.error("Error fetching converted leads:", error);
//     res.status(500).json({ message: 'Server error', error });
//   }
// };







export const getAllConvertedLeads = async (req, res) => {
  try {
    const { branch, created_at } = req.query;

    let query = `
      SELECT 
        i.*, 
        u.full_name AS counselor_name,
       (
  SELECT DATE_FORMAT(fh.next_followup_date, '%Y-%m-%d %H:%i:%s')
  FROM followuphistory fh 
  WHERE fh.inquiry_id = i.id 
  ORDER BY fh.next_followup_date DESC
  LIMIT 1
) AS next_followup_date,

(
  SELECT DATE_FORMAT(fh.last_followup_date, '%Y-%m-%d %H:%i:%s')
  FROM followuphistory fh 
  WHERE fh.inquiry_id = i.id 
  ORDER BY fh.last_followup_date DESC
  LIMIT 1
) AS last_followup_date

      FROM inquiries i
      LEFT JOIN users u ON i.counselor_id = u.counselor_id
      WHERE i.lead_status = 'Converted to Lead'
    `;

    const params = [];
    const conditions = [];

    // ✅ Branch filter (with “Both” logic)
    if (branch && branch !== 'Both') {
      conditions.push(`i.branch = ?`);
      params.push(branch);
    } else if (branch === 'Both') {
      conditions.push(`i.branch IN (?, ?)`);
      params.push('Sylhet', 'Dhaka');
    }

    // ✅ Created_at filter (from inquiries)
    if (created_at) {
      conditions.push(`DATE(i.created_at) >= ?`);
      params.push(created_at);
    }

    // ✅ Add conditions if any
    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    // ✅ Order by created_at ascending
    query += ' ORDER BY i.created_at ASC';

    // ✅ Execute query
    const [results] = await db.query(query, params);

    if (results.length === 0) {
      return res.status(404).json({ message: 'No converted leads found' });
    }

    res.status(200).json(results);

  } catch (error) {
    console.error("Error fetching converted leads:", error);
    res.status(500).json({ message: 'Server error', error });
  }
};










// export const getConvertedLeadsByCounselorId = async (req, res) => {
//   const { id } = req.params;

//   const allowedNewLeads = [
//     "New Lead",
//     "Contacted",
//     "Follow-Up Needed",
//     "Visited Office",
//     "Not Interested",
//     "Next Intake Interested",
//     "Registered",
//     "Dropped"
//   ];
//   const placeholders = allowedNewLeads.map(() => '?').join(', ');

//   try {
//     const query = `
//       SELECT 
//         i.*, 
//         u.full_name AS counselor_name,
//         (
//           SELECT fh.next_followup_date
//           FROM followuphistory fh 
//           WHERE fh.inquiry_id = i.id 
//           ORDER BY fh.id DESC 
//           LIMIT 1
//         ) AS next_followup_date,
//         (
//           SELECT fh.last_followup_date
//           FROM followuphistory fh 
//           WHERE fh.inquiry_id = i.id 
//           ORDER BY fh.id DESC 
//           LIMIT 1
//         ) AS last_followup_date
//       FROM 
//         inquiries i
//       LEFT JOIN 
//         users u ON i.counselor_id = u.counselor_id
//       WHERE 
//         i.counselor_id = ?
//         AND (i.lead_status = 'Converted to Lead' OR i.new_leads IN (${placeholders}))
//     `;

//     const params = [id, ...allowedNewLeads];
//     const [result] = await db.query(query, params);

//     if (result.length === 0) {
//       return res.status(404).json({ message: 'No leads found for this counselor' });
//     }

//     res.status(200).json(result);
//   } catch (error) {
//     console.error("Error fetching counselor-wise leads:", error);
//     res.status(500).json({ message: 'Server error', error });
//   }
// };



export const getConvertedLeadsByCounselorId = async (req, res) => {
  const { id } = req.params;

  const allowedNewLeads = [
    "New Lead",
    "Contacted",
    "Follow-Up Needed",
    "Visited Office",
    "Not Interested",
    "Next Intake Interested",
    "Registered",
    "Dropped"
  ];
  const placeholders = allowedNewLeads.map(() => '?').join(', ');

  try {
    const query = `
      SELECT 
        i.*, 
        u.full_name AS counselor_name,
        (
          SELECT fh.next_followup_date
          FROM followuphistory fh 
          WHERE fh.inquiry_id = i.id 
          ORDER BY fh.id DESC 
          LIMIT 1
        ) AS next_followup_date,
        (
          SELECT CONVERT_TZ(fh.last_followup_date, '+00:00', '+05:30')
          FROM followuphistory fh 
          WHERE fh.inquiry_id = i.id 
          ORDER BY fh.id DESC 
          LIMIT 1
        ) AS last_followup_date
      FROM 
        inquiries i
      LEFT JOIN 
        users u ON i.counselor_id = u.counselor_id
      WHERE 
        i.counselor_id = ?
        AND (i.lead_status = 'Converted to Lead' OR i.new_leads IN (${placeholders}))
    `;

    const params = [id, ...allowedNewLeads];
    const [result] = await db.query(query, params);

    if (result.length === 0) {
      return res.status(404).json({ message: 'No leads found for this counselor' });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching counselor-wise leads:", error);
    res.status(500).json({ message: 'Server error', error });
  }
};





export const updateLeadStatus = async (req, res) => {
  const { inquiry_id, new_leads } = req.body;
  const allowedStatuses = [
    "New Lead",
    "Contacted",
    "Follow-Up Needed",
    "Visited Office",
    "Not Interested",
    "Next Intake Interested",
    "Registered",
    "Dropped",
    "Not reachable",
    "Not Eligible"
  ];
  if (!inquiry_id || !new_leads) {
    return res.status(400).json({ message: 'inquiry_id and new_leads are required' });
  }
  if (!allowedStatuses.includes(new_leads)) {
    return res.status(400).json({ message: 'Invalid new_leads value' });
  }
  try {
    const [inquiry] = await db.query("SELECT id FROM inquiries WHERE id = ?", [inquiry_id]);
    if (!inquiry.length) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    await db.query("UPDATE inquiries SET new_leads = ? WHERE id = ?", [new_leads, inquiry_id]);

    res.status(200).json({ message: `Lead status updated to '${new_leads}'` });

  } catch (error) {
    console.error("Error updating lead status:", error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getAllleadsstatus = async (req, res) => {
  try {
    const query = "SELECT * FROM inquiries WHERE lead_status != '0'";
    //  const query = `
    //   SELECT 
    //     inquiries.*, 
    //     users.full_name AS counselor_name
    //   FROM inquiries
    //   LEFT JOIN counselors ON inquiries.counselor_id = counselors.id
    //   LEFT JOIN users ON users.counselor_id = counselors.id
    //   WHERE inquiries.lead_status != '0'
    // `;
    const [result] = await db.query(query);
    if (result.length === 0) {
      return res.status(404).json({ message: 'No leads found (excluding status 0)' });
    }
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// export const getCounselorWisePerformance = async (req, res) => {
//   try {
//     const [data] = await db.query(`
//       SELECT 
//         counselor_id,
//         COUNT(*) AS total_leads,
//         SUM(lead_status = 'Converted') AS converted_leads,
//         MAX(status) AS status
//       FROM inquiries
//       GROUP BY counselor_id
//     `);

//     // Optional: Map counselor_id to actual counselor names if needed
//     const formatted = data.map((row) => ({
//       counselor_id: row.counselor_id,
//       counselor_name: `Counselor`, // replace with JOIN if names exist
//       total_leads: row.total_leads,
//       converted_leads: row.converted_leads,
//       status: row.status === 1 ? 'Active' : 'Inactive',
//     }));

//     res.status(200).json(formatted);       
//   } catch (error) {
//     console.error('Error fetching counselor performance:', error);
//     res.status(500).json({ message: 'Server error', error });
//   }
// };


export const getCounselorWisePerformance = async (req, res) => {
  try {
    const [data] = await db.query(`
  SELECT 
    counselor_id,
    COUNT(*) AS total_leads,
    SUM(lead_status = 'Converted to Lead') AS converted_leads,
    MAX(status) AS status
  FROM inquiries
  WHERE counselor_id IS NOT NULL
  GROUP BY counselor_id
`);

    const formatted = data.map((row) => ({
      counselor_id: row.counselor_id,
      total_leads: row.total_leads,
      converted_leads: row.converted_leads,
      status: row.status === 1 ? 'Active' : 'Inactive',
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error('Error fetching counselor performance:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};



export const StudentAssignToProcessor = async (req, res) => {
  try {
    const { student_id, processor_id } = req.body;

    // Validate required fields
    if (!student_id) {
      return res.status(400).json({ message: "'student_id' is required" });
    }

    if (!processor_id) {
      return res.status(400).json({ message: "'processor_id' is required" });
    }

    // Build dynamic update query
    const updates = ["processor_id = ?", "updated_at = NOW()"];
    const values = [processor_id, student_id];

    const sql = `UPDATE students SET ${updates.join(", ")} WHERE id = ?`;

    const [result] = await db.query(sql, values);
    console.log("result", result);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Student ID not found" });
    } else {
      const [findProcessorName] = await db.query("SELECT full_name FROM users WHERE id = ? ", [processor_id])
      console.log("findProcessorName", findProcessorName);
      const [findStudnetName] = await db.query("SELECT full_name FROM users WHERE student_id = ? ", [student_id])
      const PName = findProcessorName[0]?.full_name;
      const SName = findStudnetName[0]?.full_name;
      console.log("findStudnetName", findStudnetName);
      const [notifyData] = await db.query(`
  INSERT INTO dashboard_notifications (counselor_id, student_id , processor_id , sNotification , pNotification  ,cNotification, message )
  VALUES (?, ?, ?, ?, ? , ? , ?)`,
        [null, student_id, processor_id, 1, 1, 0, `Student : ${SName} assigned to processor : ${PName} `]
      );
      console.log("notifyData", notifyData);

    }

    const [updatedStudent] = await db.query("SELECT * FROM students WHERE id = ?", [student_id]);

    res.status(200).json({
      message: "Student assigned to processor successfully",
      data: updatedStudent[0],
    });

  } catch (error) {
    console.error("Error assigning student to processor:", error);
    res.status(500).json({
      message: "Update failed",
      error: error.message,
    });
  }
};









// export const sendInquiryMail = async (req, res) => {
//   const {
//     full_name,
//     phone_number,
//     email,
//     inquiry_type,
//     source,
//     branch,
//     counselor_name,
//     country,
//     created_at,
//     new_leads,
//   } = req.body;

//   console.log("📩 Incoming request to send mail for:", email);

//   try {
//     // 🧩 1️⃣ Configure SMTP transporter
//     const transporter = nodemailer.createTransport({
//       host: "mail.studyfirstinfo.com",
//       port: 465,
//       secure: true,
//       auth: {
//         user: "info@studyfirstinfo.com",
//         pass: "info@2025", // ⚠️ Hardcoded for now
//       },
//     });

//     // ✅ Check SMTP connection
//     transporter.verify((error, success) => {
//       if (error) {
//         console.log("🚫 SMTP connection failed:", error);
//       } else {
//         console.log("✅ SMTP connection successful:", success);
//       }
//     });

//     // 🧩 2️⃣ Mail content
//     const mailText = `
// Dear ${full_name},

// Here are your lead details:
// - Name: ${full_name}
// - Phone: ${phone_number}
// - Email: ${email}
// - Inquiry Type: ${inquiry_type}
// - Source: ${source}
// - Branch: ${branch}
// - Counselor: ${counselor_name || "Not Assigned"}
// - Country: ${country}
// - Created At: ${created_at ? created_at.slice(0, 10) : ""}
// - Status: ${new_leads}

// Thank you for your interest.
// Regards,
// Study First Info Team
// `;

//     // 🧩 3️⃣ Send mail
//     const info = await transporter.sendMail({
//       from: `"Study First Info" <info@studyfirstinfo.com>`,
//       to: email,
//       subject: "Regarding Your Lead",
//       text: mailText,
//     });

//     console.log("✅ Mail sent successfully!");
//     console.log("📨 Message ID:", info.messageId);
//     console.log("📤 Response:", info.response);

//     res.status(200).json({
//       success: true,
//       message: "Mail sent successfully!",
//       messageId: info.messageId,
//       response: info.response,
//     });
//   } catch (error) {
//     console.error("❌ Error while sending mail:");
//     console.error(error);

//     res.status(500).json({
//       success: false,
//       message: "Mail failed to send.",
//       error: error.message,
//     });
//   }
// };




export const sendInquiryMail = async (req, res) => {
  try {
    console.log("📩 Incoming request body:", req.body);

    // ✅ Step 1: Safe destructuring
    const {
      full_name = "",
      phone_number = "",
      email = "",
      inquiry_type = "",
      source = "",
      branch = "",
      counselor_name = "",
      country = "",
      created_at = "",
      new_leads = "",
    } = req.body || {};

    if (!email || !full_name) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: full_name or email.",
      });
    }

    // ✅ Step 2: Configure transporter (from .env)
    const transporter = nodemailer.createTransport({
      host: "mail.studyfirstinfo.com",
      port: 587,
      secure: false,
      auth: {
        user: "info@studyfirstinfo.com",
        pass: "info@2025",
      },
      tls: {
         rejectUnauthorized: false,
         minVersion: "TLSv1" 
      },
    });

    // ✅ Step 3: Verify connection
    await transporter.verify();
    console.log("✅ SMTP connection verified successfully.");

    // ✅ Step 4: Mail Content
    const mailText = `
Dear ${full_name},

Here are your lead details:

- Name: ${full_name}
- Phone: ${phone_number}
- Email: ${email}
- Inquiry Type: ${inquiry_type}
- Source: ${source}
- Branch: ${branch}
- Counselor: ${counselor_name || "Not Assigned"}
- Country: ${country}
- Created At: ${created_at ? created_at.slice(0, 10) : ""}
- Status: ${new_leads}

Thank you for your interest.
Regards,
Study First Info Team
`;

    // ✅ Step 5: Send Email
    const info = await transporter.sendMail({
      from: `"Study First Info" <info@studyfirstinfo.com>`,
      to: email,
      subject: "Regarding Your Lead",
      text: mailText,
      bcc: "info@studyfirstinfo.com",
    });

    console.log("✅ Mail sent successfully:", info.messageId);

    res.status(200).json({
      success: true,
      message: "Mail sent successfully!",
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("❌ Error while sending mail:", error);
    res.status(500).json({
      success: false,
      message: "Mail failed to send.",
      error: error.message,
    });
  }
};




