import express from 'express';
import { applicationPipline, CounselorPerformance, overview } from '../controllers/reportAnalitics.controller.js';
const router = express.Router();

router.get('/overview', overview);
router.get('/counselorPerformance', CounselorPerformance);
router.get('/applicationPipline', applicationPipline)
export default router;
