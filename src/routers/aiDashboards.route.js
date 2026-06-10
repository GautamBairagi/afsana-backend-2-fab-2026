import express from 'express';
import { getPriorityList, getAppointmentsList, getDripLogs } from '../controllers/aiDashboards.controller.js';
// import auth from '../middlewares/auth.js'; // Assuming auth middleware exists if needed

const router = express.Router();

router.get('/priority', getPriorityList);
router.get('/appointments', getAppointmentsList);
router.get('/drip-logs', getDripLogs);

export default router;
