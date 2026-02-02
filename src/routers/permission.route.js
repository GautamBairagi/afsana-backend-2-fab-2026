import express from 'express';
import { createPermission, getPermissionById, getPermissions, updatePermissionStatus } from '../controllers/permission.controller.js';
const router = express.Router();

router.post('/permission',createPermission);
router.get('/permission', getPermissions);
router.get('/permission/:id', getPermissionById);
router.put('/permission/:id', updatePermissionStatus);
export default router;