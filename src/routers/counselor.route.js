import express from 'express';
import {  createCounselor, getCounselorById , updateCounselor , deleteCounselor, getAllCounselor,creategettesting ,gettesting } from '../controllers/Counselor.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
const router = express.Router();
router.post('/counselor', createCounselor);
router.get('/counselor/:id', getCounselorById);
router.put('/counselor/:id', updateCounselor);
router.delete('/counselor/:id', deleteCounselor);           
router.get('/counselor', getAllCounselor);
router.post('/createnewapi', creategettesting);
router.get('/createnewapi', gettesting);



  


export default router;  
