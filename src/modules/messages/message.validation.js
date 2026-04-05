import joi from "joi"
import { generalRoles } from "../../common/utils/General_rule.js"



export const sendMessageSchema = {
    body : joi.object ({ 
            content:joi.string().required(),
            userId:generalRoles.id.required(),
    }).required(),

    files:joi.array().items(generalRoles.file)
}

export const getMessageSchema = {
    params : joi.object ({ 
            messageId:generalRoles.id.required()
    }).required()

}