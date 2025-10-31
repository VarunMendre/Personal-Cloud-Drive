import { createClient } from "redis";

const redisClient = await createClient().connect();

redisClient.on("error", (err) => {
  console.log("Error:", err);
});

redisClient.getJSON = async function (key) {
  return JSON.parse(await this.get(key));
};

redisClient.setJSON = async function (key, value) {
  return await this.set(key, JSON.stringify(value));
};

export default redisClient;
