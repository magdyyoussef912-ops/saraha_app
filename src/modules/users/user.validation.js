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

export const updateProfileSchema = {
    body : joi.object({
        firstName:joi.string().min(3).max(5),
        lastName:joi.string().min(3).max(5),
        phone:joi.string(),
        gender:joi.string().valid(...Object.values(genderEnum)).default(genderEnum.male),
        age:joi.number()
    }).required()
}

export const updatePasswordSchema = {
    body : joi.object({
        lPassword:generalRoles.password.required(),
        nPassword:generalRoles.password.required(),
        cPassword:joi.string().valid(joi.ref("nPassword")).required()
    }).required()
}

export const confirmEmailSChema = {
    body : joi.object({
        email:generalRoles.email.required(),
        otp:joi.string().regex(/^\d{6}$/).required()
    }).required()
}

export const resendOtpSChema = {
    body : joi.object({
        email:generalRoles.email.required()
    }).required()
}