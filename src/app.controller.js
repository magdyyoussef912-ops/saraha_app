import express from "express";
import cors from "cors";
import { successeResponsive } from "./common/utils/successResponsive.js";
import checkConectionDb from "./DB/connectionDB.js";
import userRouter from "./modules/users/user.controller.js";
import { PORT } from "../config/config.service.js";
import { deleteFileMulterLocal } from "./common/middleware/multer.js";
import { redisConnection } from "./DB/redis/redisDB.js";
const app = express();

const bootstrap = () => {
  // parse data from body
  app.use(cors(), express.json());

  // local Api
  app.get("/", (req, res, next) => {
    successeResponsive({ res, status: 201, message: "welcome in our server" });
  });

  // connect DB
  checkConectionDb();
  redisConnection();

  // Apis users
  app.use("/users", userRouter);

  // static uploads
  app.use("/uploads", express.static("uploads"));

  // Listen Port
  app.listen(PORT, () => {
    console.log(`server is running at port ${PORT}`);
  });

  // Api not Found
  app.use("{/*demo}", (req, res, next) => {
    throw new Error(`404 url ${req.originalUrl} is Not Found`, { cause: 404 });
  });

  // global error handling
  app.use((err, req, res, next) => {
    deleteFileMulterLocal(req);
    return res
      .status(err.cause || 500)
      .json({ message: err.message, stack: err.stack });
  });
};

export default bootstrap;
