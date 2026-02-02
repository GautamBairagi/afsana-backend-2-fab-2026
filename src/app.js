import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fileUpload from 'express-fileupload';
dotenv.config();
const app = express();
// Fix __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tempDir = path.join(__dirname, 'tmp');
// 🔐 Middleware
app.use(cors({
  origin: '* ',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));
app.use(helmet());
app.use(morgan('dev'));
// ✅ JSON & URL-encoded body parsing (single setup)
app.use(bodyParser.json({ limit: '200mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '200mb' }));
// ✅ File upload setup
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: tempDir,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  safeFileNames: true,
  preserveExtension: 4,
  abortOnLimit: true,
  limitHandler: function (req, res) {
    res.status(400).send('File size limit exceeded');
  }
}));
// ✅ Static files
app.use('/public', express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
// ✅ Routes
import { responsePage } from './utils/testingPage.js';
import authRoutes from './routers/auth.routes.js';
import inquiryRoutes from './routers/inquiry.route.js';
import followUproute from './routers/follow_ups.router.js';
import leadRoutes from './routers/lead.router.js';
import taskRoutes from './routers/task.routes.js';
import counselor from './routers/counselor.route.js';
import admissiondecision from './routers/admissiondecisions.route.js';
import universityRoutes from './routers/university.route.js';
import invoices from './routers/invoicesRouter.js';
import permissionRoute from './routers/permission.route.js';
import Remainder from './routers/remainderRouter.js';
import paymentRoute from './routers/payment.route.js';
import branchRoutes from './routers/branch.routes.js';
import universityAplyRoutes from './routers/universityApply.routes.js';
import dashboardRoutes from './routers/dashboard.routes.js';
import chatRoutes from './routers/chat.routes.js';
import reportAnaliticsroutes from './routers/reportAnalitics.route.js';
import studentInvoiceRouter from "./routers/studentInvoiceRouter.js";
import invoiceByCounselor from "./routers/invoiceByCounselor.route.js";
import studentinvoiceByCounselors from "./routers/studentinvoiceByCounselor.router.js";
import staff from './routers/staff.routes.js';
import visaRouters from './routers/visaRouters.js';
import folowupnew from './routers/followupnew.router.js';
import groupRoutes from './routers/groupRoutes.js'; // Import group routes
import processorRoute from './routers/processorroute.js'; // Import processor routes
import notificationRoutes from './routers/notificationRoutes.js'; // Import notification routes
import studentdocuments from './routers/studentDocuments.js'; // Import notification routes
import aiChatRoutes from './routers/aiChatRoutes.js'; // Import AI chat routes
import masteradminRoutes from './routers/masteradminRoutes.js'; // Import AI chat routes
import followUpHistoryRoutes from './routers/followUpHistoryRoutes.js';
import notesRoutes from './routers/notesRoutes.js';

// ✅ Route handling

app.get('/', (_, res) => { res.send(responsePage) });
app.use('/api/auth', authRoutes);
app.use('/api', inquiryRoutes);
app.use('/api', followUproute);
app.use('/api', leadRoutes);
app.use('/api', taskRoutes);
app.use('/api', counselor);
app.use('/api', admissiondecision);
app.use('/api', universityRoutes);
app.use('/api', invoices);
app.use('/api', permissionRoute);
app.use('/api', Remainder);
app.use('/api', paymentRoute);
app.use('/api', branchRoutes);
app.use('/api', universityAplyRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', chatRoutes);
app.use('/api', reportAnaliticsroutes);
app.use('/api', studentInvoiceRouter);
app.use('/api', invoiceByCounselor);
app.use('/api', studentinvoiceByCounselors);
app.use('/api', staff);
app.use('/api', visaRouters);
app.use('/api', folowupnew);
app.use('/api', groupRoutes);
app.use('/api', processorRoute); 
app.use('/api', notificationRoutes);
app.use('/api', studentdocuments);
app.use('/api', aiChatRoutes);
app.use('/api', followUpHistoryRoutes);
app.use('/api', notesRoutes);
app.use('/api', masteradminRoutes);


// ✅ Log every incoming request
app.use((req, res, next) => {
  console.log('Incoming request:', req.method, req.url);
  next();
});
 
export default app;

