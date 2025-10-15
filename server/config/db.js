import mongoose from "mongoose";

export async function connectDB() {
  try {
     await mongoose.connect(
      "mongodb://varun:varun123@127.0.0.1:27017/storageApp"
    );
    console.log("Database connected");
  } catch (err) {
    console.log(err);
    console.log("DB Couldn't connect");
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  await mongoose.disconnect()
  console.log("Client Disconnected!");
  process.exit(0);
});
