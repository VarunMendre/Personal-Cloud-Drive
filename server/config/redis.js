import { createClient } from "redis";

const redisClient = createClient({
  username: "default",
  password: "cDVjXygLwNkvOAkRWDoICfIO971NkMRB",
  socket: {
    host: "redis-10454.c265.us-east-1-2.ec2.redns.redis-cloud.com",
    port: 10454,
  },
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));
await redisClient.connect();


export default redisClient;
