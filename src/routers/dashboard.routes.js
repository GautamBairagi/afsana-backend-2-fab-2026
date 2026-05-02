import express from 'express';
import { getDashboardData, getDashboardDataAdmin, getDashboardDataUniversity ,getDashboardInfo, getCounselorDashboardData, staffdashboard, studentsdashboard, processordashboard, masteradmindashboard, getRecentUpdates } from '../controllers/dashboard.controller.js';
const router = express.Router();

router.get ('/dashboard/:counselor_id',getDashboardData)
router.get ('/dashboard', getDashboardDataAdmin);
router.get ('/dashboardinfo', getDashboardInfo);
router.get ('/dashboardApplyUniveristy/:university_id/:studentId', getDashboardDataUniversity)
router.get ('/getCounselorDashboardData', getCounselorDashboardData);
router.get ('/staffdashboard', staffdashboard);
router.get('/studentsdashboard/:student_id', studentsdashboard);
router.get('/recent-updates/:student_id', getRecentUpdates);
router.get('/processordashboard/:processor_id', processordashboard);
router.get('/masteradmindashboard', masteradmindashboard);

export default router;