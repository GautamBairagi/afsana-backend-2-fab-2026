import express from 'express';
import { createLead, deleteLead, getLeadByCounselorId, getLeadById, getLeads, updateLead, getLeadByCounselorIdnew , updatePaymentStatus ,
updateLeadStatus, invoicestatus} from '../controllers/lead.controller.js';
const router = express.Router();
router.post('/lead',createLead);
router.get('/lead', getLeads);
router.get('/lead/:id', getLeadById);
router.get('/lead/counselor/:id', getLeadByCounselorId);
router.get('/lead/getLeadByCounselorIdnew/:id', getLeadByCounselorIdnew);
router.put('/lead/:id', updateLead);
router.delete('/lead/:id', deleteLead);
router.patch('/fee/update-status', updatePaymentStatus);
router.patch('/fee/update-lesd-status',updateLeadStatus);
router.patch('/fee/update-invoicestatus',invoicestatus);



export default router;
