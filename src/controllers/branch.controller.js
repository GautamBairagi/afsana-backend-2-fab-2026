import db from '../config/db.js';

export const createBranch = async (req, res) => {
    const { branch_name, branch_address, branch_phone, branch_email } = req.body;
    console.log("Request Body:", req.body);
  
    // Validate input
    if (!branch_name || !branch_address || !branch_phone || !branch_email) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }
  
    // SQL Query and Values
    const query = `
      INSERT INTO branches (branch_name, branch_address, branch_phone, branch_email) 
      VALUES (?, ?, ?, ?)
    `;
    const values = [branch_name, branch_address, branch_phone, branch_email];
  
    console.log("Executing Query:", query);
    console.log("Query Values:", values);
  
    try {
      // Execute the query
      const [result] = await db.query({ sql: query, timeout: 5000 }, values);
  
      console.log("Query Result:", result);
  
      // Check for affected rows
      if (result.affectedRows === 0) {
        return res.status(400).json({ message: "Branch not created" });
      }
  
      return res.status(201).json({
        message: "Branch created successfully",
        branch_id: result.insertId,
      });
  
    } catch (error) {
      console.error("Database Error:", error);
  
      // Handle duplicate entry error (e.g., unique email constraint)
      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "Branch with the same email or phone already exists" });
      }
  
      return res.status(500).json({ 
        message: "Internal server error", 
        error: error.message 
      });
    }
  };
  
  export const getBranches = async (req, res) => {
    try {
      const [branches] = await db.query("SELECT * FROM branches");
      if (branches.length === 0) {
        return res.status(404).json({ message: "No branches found" });
      }
      res.status(200).json(branches);
    } catch (error) {
      console.error("Something went wrong:", error);
      res.status(500).json({ message: "Internal server error", error });
    }
  };

  export const getBranchById = async (req, res) => {
    const { id } = req.params;
  
    try {
      if (!id) {
        return res.status(400).json({ message: "Branch ID is required" });
      }
  
      const [branch] = await db.query("SELECT * FROM branches WHERE id = ?", [id]);
  
      if (branch.length === 0) {
        return res.status(404).json({ message: "Branch not found" });
      }
  
      res.status(200).json(branch[0]);
  
    } catch (error) {
      console.error("Something went wrong:", error);
      res.status(500).json({ message: "Internal server error", error });
    }
  };

  export const updateBranch = async (req, res) => {
    const { id } = req.params;
    const { branch_name, branch_address, branch_phone, branch_email } = req.body;
  
    try {
      if (!id) {
        return res.status(400).json({ message: "Branch ID is required" });
      }
  
      const query = `
        UPDATE branches 
        SET branch_name = ?, branch_address = ?, branch_phone = ?, branch_email = ? 
        WHERE id = ?
      `;
  
      const values = [branch_name, branch_address, branch_phone, branch_email, id];
      const [result] = await db.query(query, values);    
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Branch not found or not updated" });
      }
  
      res.status(200).json({ message: "Branch updated successfully" });
  
    } catch (error) {
      console.error("Something went wrong:", error);
      res.status(500).json({ message: "Internal server error", error });
    }
  };

  export const deleteBranch = async (req, res) => {
    const { id } = req.params;
  
    try {
      if (!id) {
        return res.status(400).json({ message: "Branch ID is required" });
      }
  
      const [result] = await db.query("DELETE FROM branches WHERE id = ?", [id]);
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Branch not found or not deleted" });
      }
  
      res.status(200).json({ message: "Branch deleted successfully" });
  
    } catch (error) {
      console.error("Something went wrong:", error);
      res.status(500).json({ message: "Internal server error", error });
    }
  };
