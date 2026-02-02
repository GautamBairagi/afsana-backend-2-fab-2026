import express from 'express';
import {getStaffById, getAllStaffbybranch, createStaff , getAllStaff, deleteStaff, updateStaff , assignOrUpdatePermission,getPermissionsByUser} from '../controllers/staff.controller.js';

const router = express.Router();
router.post('/createStaff', createStaff);
router.get('/getAllStaff', getAllStaff);
router.get("/getAllStaffbybranch", getAllStaffbybranch);

router.delete('/deleteStaff/:id', deleteStaff);   
router.put('/updateStaff/:id', updateStaff); 
router.get('/getStaffById/:id', getStaffById); 



router.post('/permissions/update', assignOrUpdatePermission);
router.get('/permissions', getPermissionsByUser);



export default router;  


 