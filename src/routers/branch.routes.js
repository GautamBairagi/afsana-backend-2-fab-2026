import express from "express";
import { createBranch, deleteBranch, getBranchById, getBranches, updateBranch } from "../controllers/branch.controller.js";
const router = express.Router();


router.post('/branch',createBranch);
router.get('/branch', getBranches);
router.get('/branch/:id', getBranchById);
router.put('/branch/:id', updateBranch);
router.delete('/branch/:id', deleteBranch);


export default router;