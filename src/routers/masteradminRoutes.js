import express from 'express';
import {
  createAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  
} from '../controllers/masteradmincontroller.js';

const router = express.Router();

router.post('/createAdmin', createAdmin);
router.get('/getAllAdmins', getAllAdmins);

router.get('/getAdminById/:id', getAdminById);
router.put('/updateAdmin/:id', updateAdmin);
router.delete('/deleteAdmin/:id', deleteAdmin);

export default router;
