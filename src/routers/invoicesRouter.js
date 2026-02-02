import express from 'express';
import {
  createStudentFee,
  deleteStudentFee,
  getStudentFeeById,
  getStudentFees,
  updateStudentFee
} from '../controllers/invoiceCtrl.js';
const router = express.Router();
router.post('/payment-invoice', createStudentFee);
router.get('/payment-invoice', getStudentFees);
router.get('/payment-invoice/:id', getStudentFeeById);
router.put('/payment-invoice/:id', updateStudentFee);
router.delete('/payment-invoice/:id', deleteStudentFee);
export default router;
