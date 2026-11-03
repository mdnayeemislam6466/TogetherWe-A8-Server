import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
const futureFilter = { eventDate: { $gt: new Date() } };
const validObjectId = (id) => ObjectId.isValid(id);
const clean = (v) => typeof v === "string" ? v.trim() : "";

router.get("/", async (req,res,next) => {
 try {
  const limit = Math.min(Math.max(Number(req.query.limit)||100,1),100);
  const q = clean(req.query.q);
  const type = clean(req.query.type);
  const filter = { ...futureFilter };
  if (type && type !== "All") filter.eventType = type;
  if (q) filter.$or = [{title:{$regex:q,$options:"i"}},{location:{$regex:q,$options:"i"}}];
  const events = await getDB().collection("events").find(filter).sort({eventDate:1}).limit(limit).toArray();
  res.json({events});
 } catch(e){next(e);}
});
router.get("/mine", requireAuth, async (req,res,next) => {
 try { const events=await getDB().collection("events").find({creatorEmail:req.user.email}).sort({createdAt:-1}).toArray();res.json({events}); } catch(e){next(e);}
});
router.get("/:id", async (req,res,next) => {
 try {if(!validObjectId(req.params.id))return res.status(400).json({message:"Invalid event ID"});const event=await getDB().collection("events").findOne({_id:new ObjectId(req.params.id)});if(!event)return res.status(404).json({message:"Event not found"});res.json({event});}catch(e){next(e);}
});
router.post("/", requireAuth, async (req,res,next) => {
 try {
  const {title,description,eventType,image,location,eventDate}=req.body;
  if(![title,description,eventType,image,location,eventDate].every(v=>clean(v)))return res.status(400).json({message:"Please complete every event field."});
  const date=new Date(eventDate);
  if(Number.isNaN(date.getTime())||date<=new Date())return res.status(400).json({message:"Event date must be in the future."});
  if(!/^https?:\/\//i.test(image))return res.status(400).json({message:"Enter a valid image URL."});
  const event={title:clean(title),description:clean(description),eventType:clean(eventType),image:clean(image),location:clean(location),eventDate:date,creatorEmail:req.user.email,createdAt:new Date(),updatedAt:new Date()};
  const result=await getDB().collection("events").insertOne(event);
  res.status(201).json({message:"Event created",event:{...event,_id:result.insertedId}});
 }catch(e){next(e);}
});
router.patch("/:id", requireAuth, async (req,res,next) => {
 try {
  if(!validObjectId(req.params.id))return res.status(400).json({message:"Invalid event ID"});
  const allowed=["title","description","eventType","image","location","eventDate"];
  const update={};
  for(const key of allowed) if(req.body[key]!==undefined) update[key]=key==="eventDate"?new Date(req.body[key]):clean(req.body[key]);
  if(update.eventDate && (Number.isNaN(update.eventDate.getTime())||update.eventDate<=new Date()))return res.status(400).json({message:"Event date must be in the future."});
  update.updatedAt=new Date();
  const result=await getDB().collection("events").updateOne({_id:new ObjectId(req.params.id),creatorEmail:req.user.email},{$set:update});
  if(!result.matchedCount)return res.status(404).json({message:"Event not found or you do not own it."});
  res.json({message:"Event updated"});
 }catch(e){next(e);}
});
router.delete("/:id", requireAuth, async (req,res,next) => {
 try {
  if(!validObjectId(req.params.id))return res.status(400).json({message:"Invalid event ID"});
  const result=await getDB().collection("events").deleteOne({_id:new ObjectId(req.params.id),creatorEmail:req.user.email});
  if(!result.deletedCount)return res.status(404).json({message:"Event not found or you do not own it."});
  await getDB().collection("joinedEvents").deleteMany({eventId:req.params.id});
  res.json({message:"Event deleted"});
 }catch(e){next(e);}
});
router.post("/:id/join", requireAuth, async (req,res,next) => {
 try {
  if(!validObjectId(req.params.id))return res.status(400).json({message:"Invalid event ID"});
  const event=await getDB().collection("events").findOne({_id:new ObjectId(req.params.id),...futureFilter});
  if(!event)return res.status(404).json({message:"This event is no longer available."});
  const join={eventId:req.params.id,eventTitle:event.title,userEmail:req.user.email,joinedAt:new Date()};
  await getDB().collection("joinedEvents").insertOne(join);
  res.status(201).json({message:"You joined this event."});
 }catch(e){if(e.code===11000)return res.status(409).json({message:"You have already joined this event."});next(e);}
});
export default router;
