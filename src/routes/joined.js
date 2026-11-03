import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";
const router=Router();
router.get("/",requireAuth,async(req,res,next)=>{
 try{
  const joins=await getDB().collection("joinedEvents").find({userEmail:req.user.email}).sort({joinedAt:-1}).toArray();
  const ids=joins.map(j=>ObjectId.isValid(j.eventId)?new ObjectId(j.eventId):null).filter(Boolean);
  const events=ids.length?await getDB().collection("events").find({_id:{$in:ids}}).toArray():[];
  const map=new Map(events.map(e=>[e._id.toString(),e]));
  const ordered=joins.map(j=>map.get(j.eventId)).filter(Boolean).sort((a,b)=>new Date(a.eventDate)-new Date(b.eventDate));
  res.json({events:ordered});
 }catch(e){next(e);}
});
export default router;
