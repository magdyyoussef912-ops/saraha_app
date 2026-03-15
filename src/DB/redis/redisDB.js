import { createClient } from "redis";
import { REDIS_URL } from "../../../config/config.service.js";

export const redisClient = createClient({
  url: REDIS_URL,
});

export const redisConnection = async () => {
  try {
    redisClient.connect();
    console.log("Success to connect Redis..........😘😘🤞");
  } catch (error) {
    console.log("failed to connect Redis..........💔😒", error);
  }
};
