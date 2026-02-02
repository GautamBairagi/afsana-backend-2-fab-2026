import db from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config();
import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";
import fs from "fs";

// CREATE Fee Record
// export const createStudentFeeBYcounselor = async (req, res) => { 
//   const { student_name, description, amount, status, fee_date ,tax,  } = req.body;
//   console.log("req.body", req.body);

//   try {
//     // if (!student_name || !description || !amount || !status || !fee_date) {
//     //   return res.status(400).json({ message: 'All fields are required' });
//     // }

//     const query = `
//       INSERT INTO student_fees_by_counselor (student_name, description, amount, status, fee_date)
//       VALUES (?, ?, ?, ?, ?)`;

//     const result = await db.query(query, [student_name, description, amount, status, fee_date]);
//     if (result.affectedRows === 0) {
//       return res.status(500).json({ message: "Failed to create fee record" });
//     }
//     return res.status(200).json({ message: 'Student fee record created successfully', id: result.insertId });
//   } catch (error) {
//     console.log(`Internal server error: ${error}`);
//     res.status(500).json(error.message);
//   }
// };

// export const createStudentFeeBYcounselor = async (req, res) => { 
//   const { student_name, description, amount, fee_date, inquiry_id, user_id } = req.body;

//   console.log("req.body", req.body);

//   try {
//     // Insert fee record
//     const query = `
//      INSERT INTO student_fees_by_counselor (student_name, description, amount, fee_date, inquiry_id, user_id)
// VALUES (?, ?, ?, ?, ?, ?)

//     `;
//     const [result] = await db.query(query, [student_name, description, amount, fee_date, inquiry_id, user_id]);

//     if (result.affectedRows === 0) {
//       return res.status(500).json({ message: "Failed to create fee record" });
//     }

//     // Update is_view status in inquiries table
//     const updateViewQuery = `
//       UPDATE inquiries SET is_view = 1, updated_at = NOW() WHERE id = ?
//     `;
//     const [viewResult] = await db.query(updateViewQuery, [inquiry_id]);

//     if (viewResult.affectedRows === 0) {
//       return res.status(404).json({ message: 'Fee created but inquiry not found for view update' });
//     }

//     return res.status(200).json({ 
//       message: 'Student fee record created and is_view updated successfully', 
//       id: result.insertId 
//     });

//   } catch (error) {
//     console.log(`Internal server error: ${error}`);
//     res.status(500).json({ message: error.message });
//   }
// };




export const createStudentFeeBYcounselor = async (req, res) => {
  const { student_name, description, amount, fee_date, inquiry_id, user_id } = req.body;

  try {
    const query = `
      INSERT INTO student_fees_by_counselor (student_name, description, amount, fee_date, inquiry_id, user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(query, [student_name, description, amount, fee_date, inquiry_id, user_id]);

    if (result.affectedRows === 0) {
      return res.status(500).json({ message: "Failed to create fee record" });
    }

    await db.query(`UPDATE inquiries SET is_view = 1, updated_at = NOW() WHERE id = ?`, [inquiry_id]);

    // 🔽 Email Logic copied from your `sendMailToInquiryEmail` function
    const [rows] = await db.query(
      `SELECT 
        i.full_name, i.email, i.phone_number, i.course_name, i.city, i.country,
        i.date_of_inquiry, i.address,
        sfc.description, sfc.amount, sfc.fee_date
      FROM inquiries i
      LEFT JOIN student_fees_by_counselor sfc ON i.id = sfc.inquiry_id
      WHERE i.id = ?`,
      [inquiry_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    const { full_name, email, phone_number, course_name, city, country, date_of_inquiry, address } = rows[0];

    const feeTableRows = rows
      .filter(r => r.description && r.amount)
      .map((r, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${r.course_name}</td>
          <td>${r.description}</td>
          <td>${r.amount}</td>
          <td>${new Date(r.fee_date).toLocaleDateString()}</td>
        </tr>
      `).join("");

    const invoiceTable = feeTableRows ? `
      <h3>Invoice Details:</h3>
      <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
        <thead>
          <tr>
            <th>#</th>
            <th>Course Name</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>${feeTableRows}</tbody>
      </table><br/>` : `<p>No fee records found for this inquiry.</p>`;

    const htmlContent = `
      <p>Hello <strong>${full_name}</strong>,</p>
      <p>Your inquiry has been successfully recorded. Please find your details below:</p>
      <h3>Inquiry Summary:</h3>
      <ul>
        <li><strong>Phone:</strong> ${phone_number}</li>
        <li><strong>Course:</strong> ${course_name}</li>
        <li><strong>City:</strong> ${city}</li>
        <li><strong>Country:</strong> ${country}</li>
        <li><strong>Date of Inquiry:</strong> ${new Date(date_of_inquiry).toLocaleDateString()}</li>
        <li><strong>Address:</strong> ${address}</li>
      </ul>
      ${invoiceTable}
      <p>Our team will contact you soon. Thank you for choosing us!</p>
      <p>Regards,<br/>Study First Info</p>
    `;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'packageitappofficially@gmail.com',
        pass: 'epvuqqesdioohjvi'
      }
    });

    const mailOptions = {
      from: 'packageitappofficially@gmail.com',
      to: email,
      subject: 'Your Inquiry & Invoice Details',
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      message: 'Student fee created, view updated, and email sent successfully',
      id: result.insertId
    });

  } catch (error) {
    console.error("Internal server error:", error);
    res.status(500).json({ message: "Something went wrong", error });
  }
};

export const getInquiryByIdinvoice = async (req, res) => {
  const { inquiry_id } = req.params;
  try {
    const [rows] = await db.query(
      `
      SELECT 
        i.course_name,
        i.email,
        i.phone_number,
        i.payment_status,
        f.*
      FROM student_fees_by_counselor f
      JOIN inquiries i ON f.inquiry_id = i.id
      LEFT JOIN counselors c ON i.counselor_id = c.id
      WHERE f.inquiry_id = ?
      ORDER BY f.created_at DESC
      LIMIT 1
      `,
      [inquiry_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No record found for this inquiry ID' });
    }
    res.status(200).json(rows[0]); // return single latest joined record
  } catch (error) {
    console.error('Error fetching joined inquiry data:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// export const sendMailToInquiryEmail = async (req, res) => {
//   const { inquiry_id } = req.params;
//   try {
//     // Step 1: Get inquiry data by ID
//     const [inquiryRows] = await db.query(
//       "SELECT full_name, email FROM inquiries WHERE id = ?",
//       [inquiry_id]
//     );
//     if (inquiryRows.length === 0) {
//       return res.status(404).json({ message: "Inquiry not found" });
//     }
//     const { full_name, email } = inquiryRows[0];
//     // Step 2: Configure the transporter
//     const transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         user: 'packageitappofficially@gmail.com',
//         pass: 'epvuqqesdioohjvi'
//       }
//     });
//     // Step 3: Mail options
//     const mailOptions = {
//       from: 'packageitappofficially@gmail.com',
//       to: email,
//       subject: 'Invoice Generated Successfully',
//       html: `
//     <p>Hello <strong>${full_name}</strong>,</p>
//     <p>We are pleased to inform you that your invoice has been <strong>successfully generated</strong>.</p>
//     <p>Our counselor will be in touch with you shortly for the next steps.</p>
//     <br/>
//     <p>Thank you for choosing us!</p>
//     <p>Regards,<br/>Kiaan Technology Team</p>
//   `
//     };
//     // Step 4: Send email
//     transporter.sendMail(mailOptions, (error, info) => {
//       if (error) {
//         console.error("Email send error:", error);
//         return res.status(500).json({ message: "Email sending failed", error });
//       }
//       res.status(200).json({ message: "Email sent successfully", info });
//     });
//   } catch (error) {
//     console.error("Server error:", error);
//     res.status(500).json({ message: "Internal server error", error });
//   }
// };

export const sendMailToInquiryEmail = async (req, res) => {
  const { inquiry_id } = req.params;
  try {
    // Step 1: Fetch full inquiry and fee data using JOIN
    const [rows] = await db.query(
      `SELECT 
        i.full_name,
        i.email,
        i.phone_number,
        i.course_name,
        i.city,
        i.country,
        i.payment_status,
        i.date_of_inquiry,
        i.address,
        sfc.description,
        sfc.amount,
        sfc.fee_date
      FROM inquiries i
      LEFT JOIN student_fees_by_counselor sfc ON i.id = sfc.inquiry_id
      WHERE i.id = ?`,
      [inquiry_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Inquiry not found" });
    }
    // Step 2: Extract inquiry info (same for all rows)
    const {
      full_name,
      email,
      phone_number,
      course_name,
      city,
      country,
      date_of_inquiry,
      address
    } = rows[0];

    // Step 3: Create invoice rows (some inquiries may have multiple fee records)
    const feeTableRows = rows
      .filter(r => r.description && r.amount) // filter out if no fee
      .map((r, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${r.course_name}</td>
          <td>${r.description}</td>
          <td>${r.amount}</td>
          <td>${new Date(r.fee_date).toLocaleDateString()}</td>
        </tr>
      `).join("");

    const invoiceTable = feeTableRows
      ? `
      <h3>Invoice Details:</h3>
      <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
        <thead>
          <tr>
            <th>#</th>
            <th>Course Name</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>${feeTableRows}</tbody>
      </table><br/>`
      : `<p>No fee records found for this inquiry.</p>`;
    // Step 4: Email Content
    const htmlContent = `
      <p>Hello <strong>${full_name}</strong>,</p>
      <p>Your inquiry has been successfully recorded. Please find your details below:</p>
      <h3>Inquiry Summary:</h3>
      <ul>
        <li><strong>Phone:</strong> ${phone_number}</li>
        <li><strong>Course:</strong> ${course_name}</li>
        <li><strong>City:</strong> ${city}</li>
        <li><strong>Country:</strong> ${country}</li>
        <li><strong>Date of Inquiry:</strong> ${new Date(date_of_inquiry).toLocaleDateString()}</li>
        <li><strong>Address:</strong> ${address}</li>
      </ul>
      ${invoiceTable}
      <p>Our team will contact you soon. Thank you for choosing us!</p>
      <p>Regards,<br/>Study First Info</p>
    `;
    // Step 5: Nodemailer config
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'packageitappofficially@gmail.com',
        pass: 'epvuqqesdioohjvi'
      }
    });
    const mailOptions = {
      from: 'packageitappofficially@gmail.com',
      to: email,
      subject: 'Your Inquiry & Invoice Details',
      html: htmlContent
    };
    // Step 6: Send mail
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Email sending error:", error);
        return res.status(500).json({ message: "Failed to send email", error });
      }
      res.status(200).json({ message: "Email sent successfully", info });
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

// export const sendMailToInquiryEmail = async (req, res) => {
//   const { inquiry_id } = req.params;

//   try {
//     const [rows] = await db.query(
//       `SELECT 
//         i.full_name,
//         i.email,
//         i.phone_number,
//         i.course_name,
//         i.city,
//         i.country,
//         i.status,
//         i.lead_status,
//         i.payment_status,
//         i.date_of_inquiry,
//         i.address,
//         sfc.description,
//         sfc.amount,
//         sfc.fee_date
//       FROM inquiries i
//       LEFT JOIN student_fees_by_counselor sfc ON i.id = sfc.inquiry_id
//       WHERE i.id = ?`,
//       [inquiry_id]
//     );
//     if (rows.length === 0) {
//       return res.status(404).json({ message: "Inquiry not found" });
//     }
//     const {
//       full_name,
//       email,
//       phone_number,
//       course_name,
//       city,
//       country,
//       status,
//       lead_status,
//       payment_status,
//       date_of_inquiry,
//       address
//     } = rows[0];
//     // Step 3: Create the PDF
//     const doc = new PDFDocument();
//     const filePath = `./inquiry_${inquiry_id}.pdf`;
//     const writeStream = fs.createWriteStream(filePath);
//     doc.pipe(writeStream);

//     doc.fontSize(18).text("Inquiry & Invoice Report", { align: 'center' }).moveDown();
//     doc.fontSize(12).text(`Name: ${full_name}`);
//     doc.text(`Phone: ${phone_number}`);
//     doc.text(`Email: ${email}`);
//     doc.text(`Course: ${course_name}`);
//     doc.text(`City: ${city}`);
//     doc.text(`Country: ${country}`);
//     doc.text(`Status: ${status}`);
//     doc.text(`Lead Status: ${lead_status}`);
//     doc.text(`Payment Status: ${payment_status}`);
//     doc.text(`Date of Inquiry: ${new Date(date_of_inquiry).toLocaleDateString()}`);
//     doc.text(`Address: ${address}`);
//     doc.moveDown();
//     // Invoice table
//     if (rows.some(r => r.description && r.amount)) {
//       doc.fontSize(14).text("Invoice Details").moveDown(0.5);
//       rows.forEach((r, index) => {
//         if (r.description && r.amount) {
//           doc.fontSize(12).text(`${index + 1}. ${r.description} | ₹${r.amount} | ${new Date(r.fee_date).toLocaleDateString()}`);
//         }
//       });
//     } else {
//       doc.fontSize(12).text("No invoice records found.");
//     }
//     doc.end();
//     // Step 4: Wait for PDF to finish writing
//     writeStream.on('finish', () => {
//       // Step 5: Email with PDF attachment
//       const transporter = nodemailer.createTransport({
//         service: 'gmail',
//         auth: {
//           user: 'packageitappofficially@gmail.com',
//           pass: 'epvuqqesdioohjvi'
//         }
//       });
//       const mailOptions = {
//         from: 'packageitappofficially@gmail.com',
//         to: email,
//         subject: 'Your Inquiry & Invoice PDF Report',
//         text: `Dear ${full_name},\n\nPlease find attached your inquiry and invoice report.\n\nRegards,\nKiaan Technology`,
//         attachments: [{
//           filename: `Inquiry_${inquiry_id}.pdf`,
//           path: filePath
//         }]
//       };
//       transporter.sendMail(mailOptions, (error, info) => {
//         fs.unlinkSync(filePath); // delete the PDF after sending
//         if (error) {
//           console.error("Email send error:", error);
//           return res.status(500).json({ message: "Failed to send email", error });
//         }
//         res.status(200).json({ message: "Email with PDF sent successfully", info });
//       });
//     });
//   } catch (error) {
//     console.error("Server error:", error);
//     res.status(500).json({ message: "Internal server error", error });
//   }
// };


 // Assuming you're using a database module
// export const sendMailToInquiryEmail = async (req, res) => {
//   const { inquiry_id } = req.params;

//   try {
//     const [rows] = await db.query(
//       `SELECT 
//         i.full_name,
//         i.email,
//         i.phone_number,
//         i.course_name,
//         i.city,
//         i.country,
//         i.status,
//         i.lead_status,
//         i.payment_status,
//         i.date_of_inquiry,
//         i.address,
//         sfc.description,
//         sfc.amount,
//         sfc.fee_date
//       FROM inquiries i
//       LEFT JOIN student_fees_by_counselor sfc ON i.id = sfc.inquiry_id
//       WHERE i.id = ?`,
//       [inquiry_id]
//     );

//     if (rows.length === 0) {
//       return res.status(404).json({ message: "Inquiry not found" });
//     }

//     const {
//       full_name,
//       email,
//       phone_number,
//       course_name,
//       city,
//       country,
//       status,
//       lead_status,
//       payment_status,
//       date_of_inquiry,
//       address
//     } = rows[0];

//     // Step 3: Create the PDF
//     const doc = new PDFDocument();
//     const filePath = `./inquiry_${inquiry_id}.pdf`;
//     const writeStream = fs.createWriteStream(filePath);
//     doc.pipe(writeStream);

//     doc.fontSize(18).text("Kiaan Technology\nInquiry & Invoice Report", { align: 'center' }).moveDown();
//     doc.fontSize(12).text(`Name: ${full_name}`);
//     doc.text(`Phone: ${phone_number}`);
//     doc.text(`Email: ${email}`);
//     doc.text(`Course: ${course_name}`);
//     doc.text(`City: ${city}`);
//     doc.text(`Country: ${country}`);
//     doc.text(`Status: ${status}`);
//     doc.text(`Lead Status: ${lead_status}`);
//     doc.text(`Payment Status: ${payment_status}`);
//     doc.text(`Date of Inquiry: ${new Date(date_of_inquiry).toLocaleDateString()}`);
//     doc.text(`Address: ${address}`);
//     doc.moveDown();

//     // Invoice table
//     if (rows.some(r => r.description && r.amount)) {
//       doc.fontSize(14).text("Invoice Details").moveDown(0.5);
//       rows.forEach((r, index) => {
//         if (r.description && r.amount) {
//           doc.fontSize(12).text(`${index + 1}. ${r.description} | ₹${r.amount} | ${new Date(r.fee_date).toLocaleDateString()}`);
//         }
//       });
//     } else {
//       doc.fontSize(12).text("No invoice records found.");
//     }

//     doc.end();

//     // Step 4: Wait for PDF to finish writing
//     writeStream.on('finish', () => {
//       // Step 5: Email with PDF attachment
//       const transporter = nodemailer.createTransport({
//         service: 'gmail',
//         auth: {
//           user: 'packageitappofficially@gmail.com',
//           pass: 'epvuqqesdioohjvi'
//         }
//       });

//       const mailOptions = {
//         from: 'packageitappofficially@gmail.com',
//         to: email,
//         subject: 'Your Inquiry & Invoice PDF Report',
//         text: `Dear ${full_name},\n\nPlease find attached your inquiry and invoice report.\n\nRegards,\nKiaan Technology`,
//         attachments: [{
//           filename: `Inquiry_${inquiry_id}.pdf`,
//           path: filePath
//         }]
//       };

//       transporter.sendMail(mailOptions, (error, info) => {
//         fs.unlinkSync(filePath); // delete the PDF after sending

//         if (error) {
//           console.error("Email send error:", error);
//           return res.status(500).json({ message: "Failed to send email", error });
//         }

//         res.status(200).json({ message: "Email with PDF sent successfully", info });
//       });
//     });

//   } catch (error) {
//     console.error("Server error:", error);
//     res.status(500).json({ message: "Internal server error", error });
//   }
// };


// export const sendMailToInquiryEmail = async (req, res) => {
//   const { inquiry_id } = req.params;
//   try {
//     const [rows] = await db.query(
//       `SELECT 
//         i.full_name,
//         i.email,
//         i.phone_number,
//         i.course_name,
//         i.city,
//         i.country,
//         i.status,
//         i.lead_status,
//         i.payment_status,
//         i.date_of_inquiry,
//         i.address,
//         sfc.description,
//         sfc.amount,
//         sfc.fee_date
//       FROM inquiries i
//       LEFT JOIN student_fees_by_counselor sfc ON i.id = sfc.inquiry_id
//       WHERE i.id = ?`,
//       [inquiry_id]
//     );
//     if (rows.length === 0) {
//       return res.status(404).json({ message: "Inquiry not found" });
//     }

//     const {
//       full_name,
//       email,
//       phone_number,
//       course_name,
//       city,
//       country,
//       status,
//       lead_status,
//       payment_status,
//       date_of_inquiry,
//       address
//     } = rows[0];

//     // Step 3: Create the PDF with colors and table
//     const doc = new PDFDocument();
//     const filePath = `./inquiry_${inquiry_id}.pdf`;
//     const writeStream = fs.createWriteStream(filePath);
//     doc.pipe(writeStream);

//     // Title Section (Colored)
//     doc.fontSize(18)
//        .fillColor('#4B0082') // Purple color
//        .text("Kiaan Technology\nInquiry & Invoice Report", { align: 'center' }).moveDown();

//     // Inquiry Information Section
//     doc.fontSize(12).fillColor('black')
//        .text(`Name: ${full_name}`).moveDown(0.5)
//        .text(`Phone: ${phone_number}`).moveDown(0.5)
//        .text(`Email: ${email}`).moveDown(0.5)
//        .text(`Course: ${course_name}`).moveDown(0.5)
//        .text(`City: ${city}`).moveDown(0.5)
//        .text(`Country: ${country}`).moveDown(0.5)
//        .text(`Status: ${status}`).moveDown(0.5)
//        .text(`Lead Status: ${lead_status}`).moveDown(0.5)
//        .text(`Payment Status: ${payment_status}`).moveDown(0.5)
//        .text(`Date of Inquiry: ${new Date(date_of_inquiry).toLocaleDateString()}`).moveDown(0.5)
//        .text(`Address: ${address}`).moveDown(1);

//     // Invoice Table Section
//     doc.fontSize(14).fillColor('#4B0082').text("Invoice Details", { underline: true }).moveDown(0.5);

//     if (rows.some(r => r.description && r.amount)) {
//       // Table Header
//       doc.fontSize(12).fillColor('white')
//          .rect(50, doc.y, 500, 20) // Rectangular header
//          .fill('#4B0082') // Purple color
//          .text('Description', 50, doc.y + 5)
//          .text('Amount', 300, doc.y + 5)
//          .text('Date', 400, doc.y + 5)
//          .moveDown(1);
      
//       // Table Rows
//       rows.forEach((r, index) => {
//         if (r.description && r.amount) {
//           doc.fontSize(12).fillColor('black')
//              .text(r.description, 50, doc.y)
//              .text(`₹${r.amount}`, 300, doc.y)
//              .text(new Date(r.fee_date).toLocaleDateString(), 400, doc.y)
//              .moveDown(1);
//         }
//       });
//     } else {
//       doc.fontSize(12).fillColor('black').text("No invoice records found.");
//     }

//     doc.end();

//     // Step 4: Wait for PDF to finish writing
//     writeStream.on('finish', () => {
//       // Step 5: Email with PDF attachment
//       const transporter = nodemailer.createTransport({
//         service: 'gmail',
//         auth: {
//           user: 'packageitappofficially@gmail.com',
//           pass: 'epvuqqesdioohjvi'
//         }
//       });

//       const mailOptions = {
//         from: 'packageitappofficially@gmail.com',
//         to: email,
//         subject: 'Your Inquiry & Invoice PDF Report',
//         text: `Dear ${full_name},\n\nPlease find attached your inquiry and invoice report.\n\nRegards,\nKiaan Technology`,
//         attachments: [{
//           filename: `Inquiry_${inquiry_id}.pdf`,
//           path: filePath
//         }]
//       };

//       transporter.sendMail(mailOptions, (error, info) => {
//         fs.unlinkSync(filePath); // delete the PDF after sending

//         if (error) {
//           console.error("Email send error:", error);
//           return res.status(500).json({ message: "Failed to send email", error });
//         }

//         res.status(200).json({ message: "Email with PDF sent successfully", info });
//       });
//     });

//   } catch (error) {
//     console.error("Server error:", error);
//     res.status(500).json({ message: "Internal server error", error });
//   }
// };


// GET All Fee Records
export const getStudentFeesYcounselor = async (req, res) => {
  try {
    const query = 'SELECT * FROM student_fees_by_counselor';
    const [result] = await db.query(query);

    if (result.length === 0) {
      return res.status(404).json({ message: "No student fees found" });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.log(`Internal server error: ${error}`);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET Fee by ID
export const getStudentFeeByIdYcounselor = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM student_fees_by_counselor WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Fee record not found" });
    }
    return res.status(200).json(rows[0]);
  } catch (error) {
    console.log(`Internal server error: ${error}`);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 

// UPDATE Fee Record
export const updateStudentFeeYcounselor = async (req, res) => {
  const { id } = req.params;
  const { student_name, description, amount, status, fee_date } = req.body;
  try {
    const query = `
      UPDATE student_fees_by_counselor
      SET student_name = ?, description = ?, amount = ?, status = ?, fee_date = ?
      WHERE id = ?`;
    const result = await db.query(query, [
      student_name, description, amount, status, fee_date, id
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Fee record not found" });
    }
    return res.status(200).json({ message: 'Student fee record updated successfully' });
  } catch (error) {
    console.log(`Internal server error: ${error}`);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE Fee Record
export const deleteStudentFeeYcounselor = async (req, res) => {
  const { id } = req.params;
  try {
    const query = 'DELETE FROM student_fees_by_counselor WHERE id = ?';
    const result = await db.query(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Fee record not found" });
    }
    return res.status(200).json({ message: 'Student fee record deleted successfully' });
  } catch (error) {
    console.log(`Internal server error: ${error}`);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const getStudentFeesByUser = async (req, res) => {
  const { user_id } = req.params;

  try {
    // Query to get the student fees by user_id
    const query = `
      SELECT * FROM student_fees_by_counselor WHERE user_id = ?
    `;

    const [result] = await db.query(query, [user_id]);

    // If no records found
    if (result.length === 0) {
      return res.status(404).json({ message: 'No fee records found for this user.' });
    }

    // Return the result
    return res.status(200).json({
      message: 'Student fee records fetched successfully',
      data: result
    });
    
  } catch (error) {
    console.error('Error fetching student fees:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// // UPDATE status by ID
// export const updateFeeStatus = async (req, res) => {
//   const { id, status } = req.body;

//   if (!id || !status) {
//     return res.status(400).json({ message: 'id and status are required' });
//   }

//   try {
//     const [result] = await db.query(
//       `UPDATE student_fees_by_counselor SET status = ? WHERE id = ?`,
//       [status, id]
//     );

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ message: 'Fee record not found' });
//     }

//     res.json({ message: 'Status updated successfully' });
//   } catch (error) {
//     console.error('Error updating status:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };


// // UPDATE lesd_status by ID
// export const updateLesdStatus = async (req, res) => {
//   const { id, lesd_status } = req.body;

//   if (!id || !lesd_status) {
//     return res.status(400).json({ message: 'id and lesd_status are required' });
//   }

//   try {
//     const [result] = await db.query(
//       `UPDATE student_fees_by_counselor SET lesd_status = ?, updated_at = NOW() WHERE id = ?`,
//       [lesd_status, id]
//     );

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ message: 'Fee record not found' });
//     }

//     res.json({ message: 'Lesd status updated successfully' });
//   } catch (error) {
//     console.error('Error updating lesd_status:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };
