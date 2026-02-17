
import { model } from "mongoose"
import * as db_service from "../../DB/DB.service.js"
import userModel from "../../DB/models/user.model.js"
import { successeResponsive } from "../../common/utils/successResponsive.js"
import { Compare, Hash } from "../../common/utils/security/hash.security.js"
import { encrypt } from "../../common/utils/security/encrypt.security.js"
import { providerEnum } from "../../common/Enum/user.enum.js"
import { generateToken } from "../../common/utils/token.service.js"

export const signUp =  async(req,res,next)=>{
    const {userName,email,password,age,gender,provider,phone} = req.body
    if (await db_service.findOne({model:userModel,filter:{email}})) {
        throw new Error("email already Exist",{cause:409});
    }
    const user = await db_service.create({
        model:userModel,
        data:{
            userName,
            email,
            password:Hash({plainText:password}),
            age,
            gender,
            provider,
            phone:encrypt(phone)
        }})
    successeResponsive({res,message:"Done Create",data:user})
}


export const signIn = async (req ,res, next)=>{
    const {email , password} = req.body
    const user = await db_service.findOne({model:userModel,filter:{email,provider:providerEnum.system}})
    if (!user) {
        throw new Error("user Not Found",{cause:409})        
    }
    if (!Compare({plainText:password,cipherText:user.password})) {
        throw new Error("inValid password",{cause:409});        
    }
    const access_token = generateToken({payload:{id:user._id,email:user.email},secret_key:"secret",options:{expiresIn:"1day"}})
    successeResponsive({res,status:200,data:access_token})
}


export const profile = async (req,res,next)=>{
    successeResponsive({res,data:req.user})
}

