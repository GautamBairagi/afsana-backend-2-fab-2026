import express from 'express';
import { upload } from '../middlewares/upload.js';
import {getVisaProcessByuniversityidsss, createStudent, register, login, StudentAssignToCounselor, getAllStudents, getStudentById, deleteStudent, changeNewPassword, updateUser, getuserById, getAllByRoles, getStudentsByCounselorId, signupWithGoogle , sendOtpToEmail, verifyOtp, createStudentWithGoogle
, updateStudent, validateToken, getVisaProcessBystudentidsss, getAssignedStudents, editStudent, forgotPassword, resetPassword, getStudentByProcessorId, getStudentByCouseloerId, getAssignedStudentsincounserdashboard, getAssignedStudentsinProcessordashboard} from '../controllers/auth.controller.js';
// import { authenticate } from '../middlewares/auth.middleware.js';
const router = express.Router();
router.post('/register', register);
router.post('/login', login);
router.get('/getUser/:id',getuserById)
router.post('/changePassword/:id',changeNewPassword);
router.post('/createStudent', createStudent);
router.post('/check-google-details', signupWithGoogle);
router.post("/send-otp", sendOtpToEmail);
router.post("/verify-otp", verifyOtp);
router.patch('/StudentAssignToCounselor', StudentAssignToCounselor);
router.get('/students/by-counselor/:counselorId', getStudentsByCounselorId);
// router.get('/getStudentById/:id',authenticate, getStudentById);
router.get('/getStudentById/:id', getStudentById);



router.get('/getStudentByProcessorId/:processor_id', getStudentByProcessorId);
router.get('/getStudentByCouseloerId/:counselor_id', getStudentByCouseloerId);

router.get('/getAssignedStudentsincounserdashboard', getAssignedStudentsincounserdashboard);
router.get('/getAssignedStudentsinProcessordashboard', getAssignedStudentsinProcessordashboard);


router.get('/getAllStudents',getAllStudents);
router.put('/updateStudent/:id', updateStudent);
// router.put('/updateUser/:id', upload.fields([
//   { name: 'photo', maxCount: 1 },
//   { name: 'documents', maxCount: 1 }
// ]), updateUser);
router.put('/updateUser/:id', updateUser);

router.delete('/deleteStudent/:id', deleteStudent);
router.get("/getusersByRole/:role",getAllByRoles)
router.post('/student/google-signup', createStudentWithGoogle);
router.get('/getAssignedStudents/:counselor_id', getAssignedStudents);
router.post('/register', register);
router.post('/login', login);
router.post('/validate-token', validateToken); // 👈 Add this route
router.put('/students/:id', editStudent);

router.post('/forgotPassword', forgotPassword);
router.post('/resetPassword', resetPassword);

router.get('/getVisaProcessByuniversityidsss/:university_id/:student_id', getVisaProcessByuniversityidsss);

router.get("/getVisaProcessBystudentidsss/:student_id", getVisaProcessBystudentidsss);


export default router;






