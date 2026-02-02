import express from 'express';
import { createProcessor, getAllProcessors,
  getProcessorById,
  updateProcessor,
  deleteProcessor } from '../controllers/processorController.js';

const router = express.Router();
router.post('/createprocessor', createProcessor);
// router.get('/getAllStaff', getAllStaff);
// router.delete('/deleteStaff/:id', deleteStaff);   
// router.put('/updateStaff/:id', updateStaff); 
// router.post('/permissions/update', assignOrUpdatePermission);
// router.get('/permissions', getPermissionsByUser);

router.get('/getAllProcessors', getAllProcessors);
router.get('/getProcessorById/:id', getProcessorById);
router.put('/updateProcessor/:id', updateProcessor);
router.delete('/deleteProcessor/:id', deleteProcessor);



export default router;  









