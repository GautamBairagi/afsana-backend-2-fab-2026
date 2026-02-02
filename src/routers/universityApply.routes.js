import express from 'express';
import { createApply, deleteApply, getAllApplications, getAllApplicationsById, getAplicationBYStudentID, getApplicationByStudentAndUniversity, updateApply, updateStatus, assignCounselor , getApplicationsByCounselor, assignassignProcessorapllication , getAplicationBYProcessorID} from '../controllers/universityApply.controller.js';
import { upload } from '../middlewares/upload.js';
const router = express.Router();

router.post('/application', createApply);
router.patch('/assignCounselorapllication', assignCounselor);
router.patch('/assignassignProcessorapllication', assignassignProcessorapllication);
router.get('/applications/counselor/:counselor_id', getApplicationsByCounselor);
router.get('/application',getAllApplications);
router.get('/application/:id', getAllApplicationsById);
router.get('/studentApplication/:studentId',getAplicationBYStudentID);

router.get('/getAplicationBYProcessorID/:processorId',getAplicationBYProcessorID);

router.get('/application/:studentId/:universityId', getApplicationByStudentAndUniversity);

router.put('/application/:id', updateApply);
  router.delete('/application/:id', deleteApply);
  router.patch('/application/:id', updateStatus);
export default router;
 