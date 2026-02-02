import db from '../config/db.js';
import dotenv from 'dotenv';
import { getCounselorById } from '../models/counselor.model.js';
dotenv.config();

export const createLead = async (req, res) => {
  const {
    name, email, phone, counselor, follow_up_date,
    source, status, preferred_countries, notes, user_id
  } = req.body;
  console.log("req.body", req.body);

  try {
    if (!name || !email || !phone || !counselor || !follow_up_date || !source || !status || !preferred_countries || !notes || !user_id) {
      return res.status(400).json({ message: 'all fields are required' });
    }
    const query = `
    INSERT INTO leads 
    ( name, email, phone, counselor, follow_up_date,
        source, status, preferred_countries, notes, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const result = await db.query(query, [
      name, email, phone, counselor, follow_up_date,
      source, status, preferred_countries, notes, user_id
    ])
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Follow-up not found" });
    }
    return res.status(200).json({ message: 'lead created successfully', id: result.insertId });
  } catch (error) {
    console.log(`internal server error : ${error}`);
    res.status(500).json({ message: 'internal server error' });
  }
}

export const getLeads = async (req, res) => {
  try {
    const query = 'SELECT * FROM leads';
    const [result] = await db.query(query);
    if (result.length === 0) {
      return res.status(404).json({ message: "Follow-ups not found" });
    }
    const data = await Promise.all(
      result.map(async (lead) => {
        const counselorID = lead.counselor;
        const counselor_name = await getCounselorById(counselorID);
        console.log("counselor_name", counselor_name);
        return {
          ...lead,
          counselor_name: counselor_name[0]?.full_name
        };
      })
    );

    return res.status(200).json(data);
  } catch (error) {
    console.log(`internal server error : ${error}`);
    res.status(500).json({ message: 'internal server error' });
  }
}

export const getLeadById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM leads WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Follow-up not found" });
    }

    const data = await Promise.all(
      rows.map(async (lead) => {
        const counselorID = lead.counselor;
        const counselor_name = await getCounselorById(counselorID);
        return {
          ...lead,
          counselor_name: counselor_name[0]?.full_name || 'Unknown'
        };
      })
    );

    return res.status(200).json(data[0]); // Only one lead, so return data[0]
  } catch (error) {
    console.log(`internal server error : ${error}`);
    res.status(500).json({ message: 'internal server error' });
  }
};

export const updateLead = async (req, res) => {
  const { id } = req.params;
  const {
    name, email, phone, counselor, follow_up_date,
    source, status, preferred_countries, notes, user_id
  } = req.body;
  try {
    const query = `
        UPDATE leads
        SET name = ?, email = ?, phone = ?, counselor = ?, follow_up_date = ?,
        source = ?, status = ?, preferred_countries = ?, notes = ?, user_id = ?
        WHERE id = ?`;
    const result = await db.query(query, [
      name, email, phone, counselor, follow_up_date,
      source, status, preferred_countries, notes, user_id, id
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Follow-up not found" });
    }
    return res.status(200).json({ message: 'lead updated successfully' });
  } catch (error) {
    console.log(`internal server error : ${error}`);
    res.status(500).json({ message: 'internal server error' });
  }
}

export const deleteLead = async (req, res) => {
  const { id } = req.params;
  try {
    const query = 'DELETE FROM leads WHERE id = ?';
    const result = await db.query(query, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Follow-up not found" });
    }
    return res.status(200).json({ message: 'lead deleted successfully' });
  } catch (error) {
    console.log(`internal server error : ${error}`);
    res.status(500).json({ message: 'internal server error' });
  }
}

export const getLeadByCounselorId = async (req, res) => {
  const { id } = req.params;
  try {
    const query = 'SELECT * FROM leads WHERE counselor = ?';
    const [result] = await db.query(query, [id]);
    if (result.length === 0) {
      return res.status(404).json({ message: "Follow-ups not found" });
    }
    const data = await Promise.all(
      result.map(async (lead) => {
        const counselorID = lead.counselor;
        const counselor_name = await getCounselorById(counselorID);
        return {
          ...lead,
          counselor_name: counselor_name[0]?.full_name || 'Unknown'
        };
      })
    );

    return res.status(200).json(data);
  } catch (error) {
    console.log(`internal server error : ${error}`);
    res.status(500).json({ message: 'internal server error' });
  }
};



// export const getLeadByCounselorIdnew = async (req, res) => {
//   const { id } = req.params;
//   try {
//     const query = 'SELECT * FROM inquiries WHERE counselor_id = ?';
//     const [result] = await db.query(query, [id]);

//     if (result.length === 0) {
//       return res.status(404).json({ message: "Inquiries not found" });
//     }

//     const data = await Promise.all(
//       result.map(async (inquiry) => {
//         const counselorID = inquiry.counselor_id;
//         const counselorInfo = await getCounselorById(counselorID); // Should return [{ full_name: '...' }]
//         return {
//           ...inquiry,
//           counselor_name: counselorInfo[0]?.full_name || 'Unknown'
//         };
//       })
//     );

//     return res.status(200).json(data);
//   } catch (error) {
//     console.error("Internal server error:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

export const getLeadByCounselorIdnew = async (req, res) => {
  const { id } = req.params;
  try {
    const query = 'SELECT * FROM inquiries WHERE counselor_id = ?';
    const [result] = await db.query(query, [id]);

    if (result.length === 0) {
      return res.status(404).json({ message: "Inquiries not found" });
    }

    const data = await Promise.all(
      result.map(async (inquiry) => {
        const counselorID = inquiry.counselor_id;
        const counselorInfo = await getCounselorById(counselorID); // Should return [{ full_name: '...' }]


        return {
          id: inquiry.id,
          name: inquiry.full_name,
          email: inquiry.email,
          phone: inquiry.phone_number,
          counselor: inquiry.counselor_id,
          follow_up_date: inquiry.date_of_inquiry,
          source: inquiry.source,
          status: inquiry.status,
          is_view: inquiry.is_view,
          lead_status: inquiry.lead_status,
          new_leads: inquiry.new_leads,
          payment_status: inquiry.payment_status,
          preferred_countries: inquiry.preferred_countries || '',
          notes: inquiry.assignment_description || '',
gender:inquiry.gender,
          date_of_birth:inquiry.date_of_birth,
          address:inquiry.address,
          present_address:inquiry.present_address,
          user_id: inquiry.user_id || null,
          created_at: inquiry.created_at,
          updated_at: inquiry.updated_at,
          counselor_name: counselorInfo?.[0]?.full_name || 'Counselor'
        };
      })
    );

    return res.status(200).json(data);
  } catch (error) {
    console.error("Internal server error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// ✅ Update payment_status by ID
export const updatePaymentStatus = async (req, res) => {
  const { id, payment_status } = req.body;

  if (!id || !payment_status) {
    return res.status(400).json({ message: 'id and payment_status are required' });
  }

  try {
    const [result] = await db.query(
      `UPDATE inquiries SET payment_status = ?, updated_at = NOW() WHERE id = ?`,
      [payment_status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    res.json({ message: 'Payment status updated successfully' });
  } catch (error) {
    console.error('Error updating payment_status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};



// UPDATE lesd_status by ID
// ✅ Update lead_status by ID
export const updateLeadStatus = async (req, res) => {
  const { id, lead_status } = req.body;

  if (!id || !lead_status) {
    return res.status(400).json({ message: 'id and lead_status are required' });
  }

  try {
    // Step 1: Update the lead status
    const [result] = await db.query(
      `UPDATE inquiries SET lead_status = ?, updated_at = NOW() WHERE id = ?`,
      [lead_status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    // Step 2: Check if lead status is now "Converted to Lead"
    const [newData] = await db.query(
      "SELECT lead_status FROM inquiries WHERE id = ? AND lead_status = 'Converted to Lead'",
      [id]
    );

    // Step 3: If it's converted, update `new_leads` column to "new"
    if (newData.length > 0) {
      await db.query(
        "UPDATE inquiries SET new_leads = 'new' WHERE id = ?",
        [id]
      );
    }

    res.json({ message: 'Lead status updated successfully' });
  } catch (error) {
    console.error('Error updating lead_status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const invoicestatus = async (req, res) => {
  const { id, is_view } = req.body;

  if (!id || !is_view) {
    return res.status(400).json({ message: 'id and is_view are required' });
  }
  try {
    const [result] = await db.query(
      `UPDATE inquiries SET is_view = ?, updated_at = NOW() WHERE id = ?`,
      [is_view, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }
    res.json({ message: 'Is View status updated successfully' });
  } catch (error) {
    console.error('Error updating Is View:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// export const getLeadByCounselorIdnew = async (req, res) => {
//   const { id } = req.params;

//   try {
//     const query = 'SELECT * FROM inquiries WHERE counselor_id = ?';
//     const [result] = await db.query(query, [id]);

//     if (result.length === 0) {
//       return res.status(404).json({ message: "Inquiries not found" });
//     }

//     const data = await Promise.all(
//       result.map(async (inquiry) => {
//         const counselorID = inquiry.counselor_id;
//         const [counselorInfo] = await db.query(
//           'SELECT full_name FROM counselors WHERE id = ?',
//           [counselorID]
//         );

//         return {
//           id: inquiry.id,
//           name: inquiry.full_name,
//           email: inquiry.email,
//           phone: inquiry.phone_number,
//           counselor: inquiry.counselor_id,
//           follow_up_date: inquiry.date_of_inquiry, // Assuming this field represents follow-up
//           source: inquiry.source,
//           status: inquiry.status,
//           preferred_countries: inquiry.preferred_countries || "",
//           notes: inquiry.assignment_description || "", // Assuming you want this as notes
//           user_id: inquiry.user_id || null, // Optional: if you have this field
//           created_at: inquiry.created_at,
//           updated_at: inquiry.updated_at,
//           counselor_name: counselorInfo?.full_name || 'Counselor'
//         };
//       })
//     );

//     return res.status(200).json(data);
//   } catch (error) {
//     console.error("Internal server error:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// export const getLeadByCounselorIdnew = async (req, res) => {
//   const { id } = req.params;

//   try {
//     console.log("Counselor ID:", id);

//     const query = 'SELECT * FROM inquiries WHERE counselor_id = ?';
//     const [result] = await db.query(query, [id]);

//     console.log("Inquiry results:", result);

//     if (result.length === 0) {
//       return res.status(404).json({ message: "Inquiries not found" });
//     }

//     const data = await Promise.all(
//       result.map(async (inquiry) => {
//         try {
//           const counselorID = inquiry.counselor_id;

//           const [counselorInfo] = await db.query(
//             'SELECT full_name FROM counselors WHERE id = ?',
//             [counselorID]
//           );

//           return {
//             id: inquiry.id,
//             name: inquiry.full_name,
//             email: inquiry.email,
//             phone: inquiry.phone_number,
//             counselor: inquiry.counselor_id,
//             follow_up_date: inquiry.date_of_inquiry,
//             source: inquiry.source,
//             status: inquiry.status,
//             preferred_countries: inquiry.preferred_countries || "",
//             notes: inquiry.assignment_description || "",
//             user_id: inquiry.user_id || null,
//             created_at: inquiry.created_at,
//             updated_at: inquiry.updated_at,
//             counselor_name: counselorInfo?.[0]?.full_name || 'Counselor'
//           };
//         } catch (innerErr) {
//           console.error("Error in mapping inquiry:", innerErr);
//           throw innerErr; // rethrow to be caught in outer catch
//         }
//       })
//     );

//     return res.status(200).json(data);
//   } catch (error) {
//     console.error("Internal server error:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };


