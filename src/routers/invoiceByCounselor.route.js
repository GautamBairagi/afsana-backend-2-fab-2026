

import express from 'express';
import {
    createStudentFeeBYcounselor,
    getStudentFeesYcounselor,
    getStudentFeeByIdYcounselor,
    updateStudentFeeYcounselor,
    deleteStudentFeeYcounselor,
    getStudentFeesByUser,
    getInquiryByIdinvoice ,
    sendMailToInquiryEmail,
    // uploadImageAndSendMail
  
} from '../controllers/counselorInvoice.controller.js';
const router = express.Router();
router.post('/createStudentFeeBYcounselors', createStudentFeeBYcounselor);
router.get('/getStudentFeesYcounselor', getStudentFeesYcounselor);
router.get('/getStudentFeeByIdYcounselor/:id', getStudentFeeByIdYcounselor);
router.put('/updateStudentFeeYcounselo/:id', updateStudentFeeYcounselor);
router.delete('/deleteStudentFeeYcounselor/:id', deleteStudentFeeYcounselor);
router.get('/getStudentFeesByUser/:user_id', getStudentFeesByUser);
router.get('/getInquiryByIdinvoice/:inquiry_id', getInquiryByIdinvoice);
router.get('/send-email/inquiry/:inquiry_id', sendMailToInquiryEmail);


// router.post('/upload-image-send-mail', uploadImageAndSendMail); // Route



export default router;
 