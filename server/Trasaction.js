import { MongoClient } from "mongodb";

export const client = new MongoClient("mongodb://127.0.0.1:27017");
await client.connect();
console.log("Database Connected");

const db = client.db();
const directories = db.collection("directories");
const users = db.collection("users");

// Without Transaction session

// await directories.insertOne({ name: "db", userName: "dev" });
// await users.insertOne({ name: "de", rootDirName: "db" });

// With Transaction session
const session = client.startSession();
session.startTransaction();

try {
  await directories.insertOne({ name: "db", userName: "dev" }, { session });
  await users.insertOne({ name: "de", rootDirName: "db" }, { session });

  await session.commitTransaction();
} catch (err) {
    console.log(err);
    await session.abortTransaction();
}

await client.close();

console.log("Database Disconnected");
