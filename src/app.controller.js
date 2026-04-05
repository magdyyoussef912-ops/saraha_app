import express from "express";
import cors from "cors";
import { successeResponsive } from "./common/utils/successResponsive.js";
import checkConectionDb from "./DB/connectionDB.js";
import userRouter from "./modules/users/user.controller.js";
import { PORT, WHITE_LIST } from "../config/config.service.js";
import { deleteFileMulterLocal } from "./common/middleware/multer.js";
import { redisConnection } from "./DB/redis/redisDB.js";
import messageRouter from "./modules/messages/message.controller.js";
import helmet from "helmet";
import { rateLimit } from 'express-rate-limit'
const app = express();

const bootstrap = () => {

  const limiter = rateLimit({
    windowMs: 3 * 60 * 1000, // 3 minutes
    limit: 5, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again after 3 minutes",
    handler:(req, res, next) => {
      return res.status(429).json({ message: 'Too many requests from this IP, please try again after 3 minutes' });
    },
  });

  const corsOptions = {
    origin: function (origin, callback) {
      if ([...WHITE_LIST, undefined].includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    }
  }

  // parse data from body
  app.use(
  cors(corsOptions),
  helmet(),
  limiter,
  express.json()
  );

  // local Api
  app.get("/", (req, res, next) => {
    successeResponsive({ res, status: 201, message: "welcome in our server" });
  });

  // connect DB
  checkConectionDb();
  redisConnection();

  // Apis users
  app.use("/users", userRouter);
  app.use("/messages", messageRouter);

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
