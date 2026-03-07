import joi from "joi"
import { Types } from "mongoose"


export const generalRoles = {
    email :joi.string().email({tlds:{allow:true},minDomainSegments:2,maxDomainSegments:2}),
    password:joi.string().regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/),
    cPassword:joi.string().valid(joi.ref("password")),
    id:joi.string().custom((value,helper)=>{
        const isValid = Types.ObjectId.isValid(value)
        return isValid ? value : helper.message("inValid id")
    }),

    file: joi.object({
        fieldname: joi.string().required(),
        originalname: joi.string().required(),
        encoding: joi.string().required(),
        mimetype: joi.string().required(),
        destination: joi.string().required(),
        filename: joi.string().required(),
        path: joi.string().required(),
        size: joi.number().required()
    }).messages({
        'any.required':"file is required"
    })
}
