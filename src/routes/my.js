import { Router } from "express";
import { getDB } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";
const router=Router();
router.get("/events",requireAuth,async(req,res,next)=>{try{const events=await getDB().collection("events").find({creatorEmail:req.user.email}).sort({createdAt:-1}).toArray();res.json({events});}catch(e){next(e);}});
export default router;
