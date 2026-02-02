
import express from 'express';
import {GetVisaProcessbyfilter, getVisaProcessBycounselorid, getVisaProcessByprocessorid,updateDocumentStatus, createVisaProcess, updateVisaProcess, GetVisaProcess, getVisaApplicationById, deleteVisaApplication ,getVisaProcessByStudentId } from '../controllers/visa_process.js';
import { upload } from '../middlewares/upload.js';
import { getAllAdmissionDecisions } from '../controllers/AdmissionDecisions.controller.js';

const router = express.Router();
router.post('/createVisaProcess/', createVisaProcess);
router.put('/createVisaProcess/:id',updateVisaProcess);
router.get('/VisaProcess',GetVisaProcess);
router.get('/GetVisaProcessbyfilter',GetVisaProcessbyfilter);



router.get('/VisaProcess/:id',getVisaApplicationById);
router.delete('/VisaProcess/:id',deleteVisaApplication);
router.get('/getVisaProcessByStudentId/VisaProcess/:student_id/:university_id', getVisaProcessByStudentId);



router.put('/VisaProcess/status/:id', updateDocumentStatus);
router.get('/getVisaProcessByprocessorid/VisaProcess/:processor_id', getVisaProcessByprocessorid);
router.get('/getVisaProcessBycounselorid/VisaProcess/:counselor_id', getVisaProcessBycounselorid);






export default router;
