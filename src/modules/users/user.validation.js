import joi from "joi"
import { genderEnum, providerEnum } from "../../common/Enum/user.enum.js"



export const signUpSchema =  {
    body : joi.object ({ 
        userName:joi.string().min(3).required(),
        email:joi.string().email().required(),
        password:joi.string().min(8).max(20).required(),
        cPassword:joi.string().valid(joi.ref("password")),
        age:joi.number().required(),
        gender:joi.string().valid(...Object.values(genderEnum)).default(genderEnum.male),
        provider:joi.string().valid(...Object.values(providerEnum)).default(providerEnum.system),
        phone:joi.string().required()
    }).required()
}

export const signInSchema = {
    body : joi.object({
        email:joi.string().email(),
        password:joi.string()
    }).options({presence:"required"})
}