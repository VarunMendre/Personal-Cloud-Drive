import { MongoClient } from "mongodb";

export const client = new MongoClient("mongodb://varun:varun123@127.0.0.1:27017/storageApp");

export async function connectDB() {
  await client.connect();
  const db = client.db();
  console.log("Database connected");
  return db;
}

process.on("SIGINT", async () => {
  await client.close();
  console.log("Client Disconnected!");
  process.exit(0);
});
