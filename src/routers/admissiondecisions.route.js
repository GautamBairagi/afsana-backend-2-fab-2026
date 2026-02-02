import express from 'express';
import { getAdmissionDecisionById ,updateAdmissionStatus, getAllAdmissionDecisions ,updateAdmissionDecision ,createAdmissionDecision, deleteAdmissionDecision, getAdmissionDecisionsByStudentId} from '../controllers/AdmissionDecisions.controller.js';
const router = express.Router();

router.post('/admissiondecision', createAdmissionDecision);
router.get('/admissiondecision/:id', getAdmissionDecisionById);
router.put('/admissiondecision/:id', updateAdmissionDecision);
router.get('/admissiondecision', getAllAdmissionDecisions);
router.patch('/admissiondecision/:id', updateAdmissionStatus);
router.delete('/admissiondecision/:id', deleteAdmissionDecision);
router.get('/admissiondecisions/:student_id', getAdmissionDecisionsByStudentId);

export default router;  