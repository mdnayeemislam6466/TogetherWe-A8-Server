import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import eventsRouter from "./routes/events.js";
import joinedRouter from "./routes/joined.js";\nimport myRouter from "./routes/my.js";
import { notFound,errorHandler } from "./middleware/errors.js";

const app=express();
app.use(cors({origin:process.env.CLIENT_ORIGIN||"http://localhost:3000",credentials:true}));
app.use(express.json({limit:"1mb"}));
app.get("/api/health",(req,res)=>res.json({status:"ok",service:"TogetherWe API"}));
app.use("/api/events",eventsRouter);
app.use("/api/my",myRouter);
app.use("/api/joined",joinedRouter);
app.use(notFound);
app.use(errorHandler);
const port=process.env.PORT||5000;
connectDB().then(()=>app.listen(port,()=>console.log(`TogetherWe API running on ${port}`))).catch(err=>{console.error("Failed to connect to MongoDB",err);process.exit(1);});
