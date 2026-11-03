import { MongoClient } from "mongodb";
const client = new MongoClient(process.env.MONGODB_URI);
let db;
export async function connectDB() {
  await client.connect();
  db = client.db(process.env.DB_NAME || "togetherwe");
  await db.collection("events").createIndex({ eventDate: 1 });
  await db.collection("joinedEvents").createIndex({ eventId: 1, userEmail: 1 }, { unique: true });
  await db.collection("events").createIndex({ creatorEmail: 1 });
  console.log("MongoDB connected");
}
export function getDB() {
  if (!db) throw new Error("Database has not connected");
  return db;
}
