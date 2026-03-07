import joi from "joi"
import { genderEnum, providerEnum } from "../../common/Enum/user.enum.js"
import { generalRoles } from "../../common/utils/General_rule.js";

export const signUpSchema =  {
    body : joi.object ({ 
        userName:joi.string().min(3).required(),
        email:generalRoles.email.required(),
        password:generalRoles.password.required(),
        cPassword:generalRoles.cPassword,
        age:joi.number().required(),
        gender:joi.string().valid(...Object.values(genderEnum)).default(genderEnum.male),
        provider:joi.string().valid(...Object.values(providerEnum)).default(providerEnum.system),
        phone:joi.string().required()
    }).required(),

    file: generalRoles.file.required()
}
export const signInSchema = {
    body : joi.object({
        email:joi.string().email(),
        password:joi.string()
    }).options({presence:"required"})
}

export const shareProfileSchema = {
    params : joi.object({
        id:generalRoles.id.required()
    }).required()
}