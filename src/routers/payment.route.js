import express from 'express';
import { upload } from '../middlewares/upload.js';
import {getPaymentsWithoutInvoiceById,getStudentsWithInvoicesByCounselorId, createPayment, getPaymentByEmail, getPayments,deletePayment ,getPaymentsByid} from '../controllers/payment.controller.js';
const router = express.Router();

router.post("/payments", createPayment);
router.get('/payments',getPayments);
router.get('/payments/:email',getPaymentByEmail) ;
router.get('/paymentsbyid/:student_id',getPaymentsByid) ;
router.get('/getPaymentsWithoutInvoiceById/:student_id',getPaymentsWithoutInvoiceById) ;


router.delete('/payments/:id',deletePayment) ;

router.get('/students/invoices/:counselor_id', getStudentsWithInvoicesByCounselorId);
export default router;
