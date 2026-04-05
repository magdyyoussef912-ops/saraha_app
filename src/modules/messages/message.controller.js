import { Router } from "express";
import * as MS from "./message.service.js";
import * as MV from "./message.validation.js";
import { multer_enum } from "../../common/Enum/multer.enum.js";
import { multer_host } from "../../common/middleware/multer.js";
import { validation } from "../../common/middleware/validations.js";
import { authentication } from "../../common/middleware/authentication.js";

const messageRouter = Router()


// send message
messageRouter.post("/send",
    multer_host([...multer_enum.image]).array("attachments",3), 
    validation(MV.sendMessageSchema),
    MS.sendMessage
);

// get message
messageRouter.get("/:messageId",
    authentication,
    validation(MV.getMessageSchema),
    MS.getMessage
);

// get all messages
messageRouter.get("/get-all-messages",
    authentication,
    MS.getAllMessages
);


export default messageRouter;