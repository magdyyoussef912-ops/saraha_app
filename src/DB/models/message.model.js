import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    content:{
        type: String,
        minLenght:1,
        required:true
    },
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    attachments:[String]
},{
    timestamps:true,
    strictQuery:true,
})

const messageModel = mongoose.models.message || mongoose.model("message",messageSchema)

export default messageModel