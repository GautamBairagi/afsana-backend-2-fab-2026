import db from '../config/db.js';
import cloudinary from "cloudinary";
import fs from 'fs';

cloudinary.config({
  cloud_name: 'dkqcqrrbp',
  api_key: '418838712271323',
  api_secret: 'p12EKWICdyHWx8LcihuWYqIruWQ'
});

// export const createUniversity = async (req, res) => {
//   try {
//     const {
//       user_id,
//       name,
//       location,
//       programs,
//       highlights,
//       contact_phone,
//       contact_email,
//     } = req.body;
//     // Extract uploaded logo file
//     const logoFile = req.file;
//     console.log("logofile : ",logoFile);
//     const logo_url = logoFile
//       ? `/uploads/${logoFile.filename}`
//       : '';

//     // Validate required fields
//     if (!user_id || !name) {
//       return res.status(400).json({ message: 'user_id and name are required' });
//     }

//     // Store university in DB
//     const [result] = await db.query(
//       `INSERT INTO universities 
//        (user_id, name, logo_url, location, programs, highlights, contact_phone, contact_email) 
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         user_id,
//         name,
//         logo_url,
//         location,
//         JSON.stringify(programs),
//         JSON.stringify(highlights),
//         contact_phone,
//         contact_email,
//       ]
//     );

//     res.status(201).json({ message: 'University created successfully', universityId: result.insertId });
//   } catch (error) {
//     console.error('Error creating university:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };




// export const createUniversity = async (req, res) => {
//   try {
//     const {
//       user_id,
//       name,
//       location,
//       programs,
//       highlights,
//       contact_phone,
//       contact_email,
//     } = req.body;

//     let logo_url = '';

//     // Upload logo to Cloudinary if file is present
//     if (req.file) {
//       const result = await cloudinary.v2.uploader.upload(req.file.path, {
//         folder: "university_logos"
//       });
//       logo_url = result.secure_url;

//       // Delete local file after upload
//       fs.unlinkSync(req.file.path);
//     }

//     // Validate required fields
//     if (!user_id || !name) {
//       return res.status(400).json({ message: 'user_id and name are required' });
//     }

//     // Store university in DB
//     const [insertResult] = await db.query(
//       `INSERT INTO universities 
//        (user_id, name, logo_url, location, programs, highlights, contact_phone, contact_email) 
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         user_id,
//         name,
//         logo_url,
//         location,
//         JSON.stringify(programs),
//         JSON.stringify(highlights),
//         contact_phone,
//         contact_email,
//       ]
//     );

//     res.status(201).json({
//       message: 'University created successfully',
//       universityId: insertResult.insertId,
//     });

//   } catch (error) {
//     console.error('Error creating university:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };






// export const createUniversity = async (req, res) => {
//   try {
//     const {
//       user_id,
//       name,
//       location,
//       programs,
//       highlights,
//       contact_phone,
//       contact_email,
//     } = req.body;

//     console.log("Received body data:", req.body);
//     console.log("Received files:", req.files);

//     let logo_url = ''; // 🟢 your column is named 'imagge'

//     if (req.files && req.files.logo_url) {
//       const file = req.files.logo_url;
//       console.log("Image file found:", file.name);

//       try {
//         const uploadResult = await cloudinary.uploader.upload(file.tempFilePath, {
//           folder: 'university_logos',
//           resource_type: 'logo_url',
//         });

//         logo_url = uploadResult.secure_url;
//         console.log("Cloudinary Upload Result:", uploadResult);

//         fs.unlinkSync(file.tempFilePath); // cleanup
//       } catch (err) {
//         console.error("Cloudinary upload error:", err);
//         return res.status(500).json({ message: 'Image upload failed' });
//       }
//     } else {
//       console.log("No image file received.");
//     }

//  // ✅ Parse programs/highlights if sent as string
//     const parsedPrograms = Array.isArray(programs) ? programs : JSON.parse(programs || '[]');
//     const parsedHighlights = Array.isArray(highlights) ? highlights : JSON.parse(highlights || '[]');


//     // ✅ Insert into database (column is 'imagge')
//     const [insertResult] = await db.query(
//       `INSERT INTO universities 
//        (user_id, name, logo_url, location, programs, highlights, contact_phone, contact_email) 
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         user_id,
//         name,
//         logo_url,
//         location,
//         JSON.stringify(programs),
//         JSON.stringify(highlights),
//         contact_phone,
//         contact_email,
//       ]
//     );

//     // ✅ Get the inserted record
//     const [rows] = await db.query(`SELECT * FROM universities WHERE id = ?`, [insertResult.insertId]);
//      const university = rows[0];
//     university.programs = JSON.parse(university.programs || '[]');
//     university.highlights = JSON.parse(university.highlights || '[]');

//     res.status(201).json({
//       message: 'University created successfully',
//       data: university,
//     });

//   } catch (error) {
//     console.error('Error creating university:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };

                     

export const createUniversity = async (req, res) => {
  try {
    const {
      user_id,
      name,
      location,
      programs,
      highlights,
      contact_phone,
      contact_email,
    } = req.body;

    console.log("Received body data:", req.body);
    console.log("Received files:", req.files);

    let logo_url = '';

    // ✅ Handle image upload to Cloudinary
    if (req.files && req.files.logo_url) {
      const file = req.files.logo_url;
      console.log("Image file found:", file.name);

      try {
        const uploadResult = await cloudinary.uploader.upload(file.tempFilePath, {
          folder: 'university_logos',
        });

        logo_url = uploadResult.secure_url;
        console.log("Cloudinary Upload Result:", uploadResult);

        fs.unlinkSync(file.tempFilePath); // Cleanup temp file
      } catch (err) {
        console.error("Cloudinary upload error:", err);
        return res.status(500).json({ message: 'Image upload failed' });
      }
    } else {
      console.log("No image file received.");
    }

    // ✅ Parse programs/highlights if sent as string
    const parsedPrograms = Array.isArray(programs) ? programs : JSON.parse(programs || '[]');
    const parsedHighlights = Array.isArray(highlights) ? highlights : JSON.parse(highlights || '[]');

    // ✅ Insert into database
    const [insertResult] = await db.query(
      `INSERT INTO universities 
       (user_id, name, logo_url, location, programs, highlights, contact_phone, contact_email) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        name,
        logo_url,
        location,
        JSON.stringify(parsedPrograms),
        JSON.stringify(parsedHighlights),
        contact_phone,
        contact_email,
      ]
    );

    // ✅ Get the inserted record and parse arrays
    const [rows] = await db.query(`SELECT * FROM universities WHERE id = ?`, [insertResult.insertId]);
    const university = rows[0];
    university.programs = JSON.parse(university.programs || '[]');
    university.highlights = JSON.parse(university.highlights || '[]');

    res.status(201).json({
      message: 'University created successfully',
      data: university,
    });

  } catch (error) {
    console.error('Error creating university:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};







  // export const getAllUniversities = async (req, res) => {
  //   try {
  //     const [rows] = await db.query('SELECT * FROM universities');
  //     const parsedRows = rows.map((row) => ({
  //       ...row,
  //       logo_url: row.logo_url ? `${req.protocol}://${req.get('host')}${row.logo_url}` : null,
  //       programs: JSON.parse(row.programs || '[]'),
  //       highlights: JSON.parse(row.highlights || '[]'),
  //     }));
  //     res.status(200).json(parsedRows);
  //   } catch (error) {
  //     console.error('Error fetching universities:', error);
  //     res.status(500).json({ message: 'Internal server error' });
  //   }
  // };
  


export const getAllUniversities = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM universities');

    const parsedRows = rows.map((row) => ({
      ...row,
      // ✅ Leave full URLs untouched
      logo_url: row.logo_url || null,
      programs: JSON.parse(row.programs || '[]'),
      highlights: JSON.parse(row.highlights || '[]'),
    }));

    res.status(200).json(parsedRows);
  } catch (error) {
    console.error('Error fetching universities:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 



  export const getUniversityById = async (req, res) => {
    try {
      const { id } = req.params;
      const [rows] = await db.query('SELECT * FROM universities WHERE id = ?', [id]);
  
      if (rows.length === 0) {
        return res.status(404).json({ message: 'University not found' });
      }

      console.log(rows);
      
  
      const parsedRows = rows.map((row) => ({
        ...row,
        logo_url: row.logo_url ? `${req.protocol}://${req.get('host')}$/api{row.logo_url}` : null,
        programs: JSON.parse(row.programs || '[]'),
        highlights: JSON.parse(row.highlights || '[]'),
      }));
  
      res.status(200).json(parsedRows[0]);
    } catch (error) {
      console.error('Error fetching university:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
  
//  export const updateUniversity = async (req, res) => {
//     try {
//       const { id } = req.params;
//       const {
//         user_id,
//         name,
//         logo_url,
//         location,
//         programs,
//         highlights,
//         contact_phone,
//         contact_email,
//       } = req.body; 

//       console.log("Received body data:", req.body);
  
//       const [result] = await db.query(
//         `UPDATE universities SET 
//         user_id = ?, 
//         name = ?, 
//         logo_url = ?, 
//         location = ?, 
//         programs = ?, 
//         highlights = ?, 
//         contact_phone = ?, 
//         contact_email = ?, 
//         updated_at = CURRENT_TIMESTAMP 
//         WHERE id = ?`,
//         [
//           user_id,
//           name,
//           logo_url,
//           location,
//           JSON.stringify(programs),
//           JSON.stringify(highlights),
//           contact_phone,
//           contact_email,
//           id,
//         ]
//       );
  
//       if (result.affectedRows === 0) {
//         return res.status(404).json({ message: 'University not found' });
//       }
//       const [updatedRows] = await db.query(
//       `SELECT * FROM universities WHERE id = ?`,
//       [id]
//     );

//     return res.status(200).json({
//       message: 'University updated successfully',
//       data: updatedRows[0],
//     });
//       // res.status(200).json({ message: 'University updated successfully' });
//     } catch (error) {
//       console.error('Error updating university:', error);
//       res.status(500).json({ message: 'Internal server error' });
//     }
//   };

 




export const updateUniversity = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      user_id,
      name,
      location,
      programs,
      highlights,
      contact_phone,
      contact_email,
    } = req.body;

    console.log("Received body data:", req.body);
    console.log("Received files:", req.files);

    let logo_url = req.body.logo_url || '';

    // ✅ Handle optional logo file upload
    if (req.files && req.files.logo_url) {
      const file = req.files.logo_url;
      console.log("Image file found for update:", file.name);

      try {
        const uploadResult = await cloudinary.uploader.upload(file.tempFilePath, {
          folder: 'university_logos',
        });

        logo_url = uploadResult.secure_url;
        console.log("Cloudinary Upload Result (update):", uploadResult);

        fs.unlinkSync(file.tempFilePath); // Cleanup temp file
      } catch (err) {
        console.error("Cloudinary upload error:", err);
        return res.status(500).json({ message: 'Image upload failed' });
      }
    }

    // ✅ Parse programs and highlights
    const parsedPrograms = Array.isArray(programs) ? programs : JSON.parse(programs || '[]');
    const parsedHighlights = Array.isArray(highlights) ? highlights : JSON.parse(highlights || '[]');

    const [result] = await db.query(
      `UPDATE universities SET 
        user_id = ?, 
        name = ?, 
        logo_url = ?, 
        location = ?, 
        programs = ?, 
        highlights = ?, 
        contact_phone = ?, 
        contact_email = ?, 
        updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [
        user_id,
        name,
        logo_url,
        location,
        JSON.stringify(parsedPrograms),
        JSON.stringify(parsedHighlights),
        contact_phone,
        contact_email,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'University not found' });
    }

    const [updatedRows] = await db.query(`SELECT * FROM universities WHERE id = ?`, [id]);
    const updatedUniversity = updatedRows[0];
    updatedUniversity.programs = JSON.parse(updatedUniversity.programs || '[]');
    updatedUniversity.highlights = JSON.parse(updatedUniversity.highlights || '[]');

    res.status(200).json({
      message: 'University updated successfully',
      data: updatedUniversity,
    });
  } catch (error) {
    console.error('Error updating university:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const deleteUniversity = async (req, res) => {
    try {
      const { id } = req.params;
      const [result] = await db.query('DELETE FROM universities WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'University not found' });
      }
      res.status(200).json({ message: 'University deleted successfully' });
    } catch (error) {
      console.error('Error deleting university:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

