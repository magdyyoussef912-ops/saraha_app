
import * as  db_service from "../../DB/DB.service.js";
import cloudinary from "../../common/utils/cloudinary.js";
import { successeResponsive } from "../../common/utils/successResponsive.js";
import userModel from "../../DB/models/user.model.js";
import messageModel from "../../DB/models/message.model.js";


export const sendMessage = async (req, res) => {
    const {userId, content,attachments} = req.body

    let arr = []
    if(req.files.length){
            for (const key of req.files) {
            await cloudinary.uploader.upload(key.path,
                    {folder:"saraha_app/messages",
                        source_type:"image"
                    }
                )
            arr.push(key.path)
        }
    }


    if(!await db_service.findById({model:userModel,filter:userId})) {
        throw new Error("User not found");
    }

    const message = await db_service.create({
        model:messageModel,
        data:{
            userId,
            content,
            attachments:arr
        }}
    )

    successeResponsive({res,status:201,message:"Message sent successfully",data:message})
}

export const getMessage = async (req, res) => {
    const {messageId} = req.params

    const message = await db_service.findById({
        model:messageModel,
        filter:messageId
    })

    if(!message) {
        throw new Error("Message not found");
    }

    successeResponsive({res,status:201,message:"Message retrieved successfully",data:message})
}

export const getAllMessages = async (req, res) => {

    const messages = await db_service.findAll({
        model:messageModel,
        filter:{
            userId:req.user._id
        },
    })

    if(!messages) {
        throw new Error("Messages not found");
    }

    successeResponsive({res,status:201,message:"Messages retrieved successfully",data:messages})
}