import express from "express";
import {
  createFollowUp,
  getAllFollowUps,
  getFollowUpById,
  getFollowUpsByInquiryId,
  updateFollowUp,
  deleteFollowUp,
  getFollowUpsByCoueloerid
} from "../controllers/followupnew..controller.js";

const router = express.Router();

router.post("/createFollowUpnew", createFollowUp);
router.get("/getAllFollowUpsnew", getAllFollowUps);
router.get("/getFollowUpById/:id", getFollowUpById);
router.get("/getFollowUpsByInquiryId/:inquiry_id", getFollowUpsByInquiryId);
router.put("/updateFollowUp/:id", updateFollowUp);
router.delete("/deleteFollowUp/:id", deleteFollowUp);
router.get("/getFollowUpsByCoueloerid/:counselor_id", getFollowUpsByCoueloerid);





export default router;
