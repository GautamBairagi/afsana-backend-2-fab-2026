import express from 'express';
import {
  createstudentinvoice,
  getallstudent,
  // getStudentinvoice,
  updatePaymentStatus
//   deleteStudentFee,
//   getStudentFeeById,
//   getStudentFees,
//   updateStudentFee
} from '../controllers/studentInvoiceCtrl.js';

const router = express.Router();

router.post('/student_invoice', createstudentinvoice);
router.get('/getallstudentname', getallstudent);
router.patch("/payment_status/:student_id",updatePaymentStatus)
// router.get('/payment-invoice', getStudentFees);
// router.get('/payment-invoice/:id', getStudentFeeById);
// router.put('/payment-invoice/:id', updateStudentFee);
// router.delete('/payment-invoice/:id', deleteStudentFee);

export default router;
