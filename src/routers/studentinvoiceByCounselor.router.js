import express from 'express';
import {
  createstudentinvoiceBycounselor,
  getallstudentBycounselor,
  updatePaymentStatusBycounselor,
  getstudentFeesByid
} from '../controllers/studentinvoicebycounselor.controller.js';
const router = express.Router();
router.post('/student_invoice', createstudentinvoiceBycounselor);
router.get('/getallstudentname', getallstudentBycounselor);
router.patch("/payment_status/:student_id",updatePaymentStatusBycounselor)
router.get('/getstudentFeesByid/:id', getstudentFeesByid);



// router.get('/payment-invoice', getStudentFees);
// router.get('/payment-invoice/:id', getStudentFeeById);
// router.put('/payment-invoice/:id', updateStudentFee);
// router.delete('/payment-invoice/:id', deleteStudentFee);
export default router;
