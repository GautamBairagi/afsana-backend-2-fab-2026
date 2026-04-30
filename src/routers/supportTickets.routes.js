import express from 'express';
import { 
  createTicket, 
  getStudentTickets, 
  getAllTickets, 
  updateTicketStatus 
} from '../controllers/supportTickets.controller.js';

const router = express.Router();

router.post('/supportTickets', createTicket);
router.get('/supportTickets/student/:student_id', getStudentTickets);
router.get('/supportTickets', getAllTickets);
router.put('/supportTickets/:id/status', updateTicketStatus);

export default router;
