import {OAuth2Client} from 'google-auth-library';
import * as db_service from "../../DB/DB.service.js"
import userModel from "../../DB/models/user.model.js"
import { successeResponsive } from "../../common/utils/successResponsive.js"
import { Compare, Hash } from "../../common/utils/security/hash.security.js"
import { decrypt, encrypt } from "../../common/utils/security/encrypt.security.js"
import { providerEnum } from "../../common/Enum/user.enum.js"
import { generateToken, verifyToken } from "../../common/utils/token.service.js"
import { ACCESS_SECRET_KEY, PREFIX, REFRESH_SECRET_KEY } from '../../../config/config.service.js';
import cloudinary from '../../common/utils/cloudinary.js';

export const signUp =  async(req,res,next)=>{
    const {userName,email,password,cPassword,age,gender,provider,phone} = req.body
    // console.log(req.file);
    
    if (password !== cPassword) {
        throw new Error("inValid cPassword",{cause:409});        
    }
    
    const {secure_url,public_id} = await cloudinary.uploader.upload(req.file.path,{
        folder:"saraha_app/users",
        resource_type:"image"
    })
    // let paths = []
    // for (const key of req.files.cover) {
    //     const {secure_url,public_id} = await cloudinary.uploader.upload(key.path,{
    //         folder:"saraha_app/users",
    //         resource_type:"image"
    //     })
    //     paths.push({secure_url,public_id})
    // }

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
            phone:encrypt(phone),
            profilePicture:{secure_url,public_id},
            // coverPicture:paths
        }})
    successeResponsive({res,message:"Done Create",data:user})
}

export const signUpWithGmail =  async(req,res,next)=>{
    const {idToken} = req.body
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
        idToken,
        audience: "1062024282074-g830d7goohg80jhuk9hm0po33550snr6.apps.googleusercontent.com", 
    });
    const payload = ticket.getPayload();
    const {email ,email_verified,name,picture} = payload

    let user = await db_service.findOne({model:userModel,filter:{email}})
    
    if(!user){
        user = await db_service.create(
            {
                model:userModel,
                data:{
                    email ,
                    confirmed:email_verified,
                    userName:name,
                    profilePicture:picture,
                    provider:providerEnum.google
                }
            })
    }

    if (user.provider == providerEnum.system) {
        throw new Error("Pls log in with system",{cause:400});
    }

    const access_token = generateToken({
        payload:{id:user._id,email},
        secret_key:SECRET_KEY,
        options:{expiresIn:"1day"}
    })
    successeResponsive({res,status:201,data:access_token})
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
    const access_token = generateToken({
        payload:{id:user._id,email:user.email},
        secret_key:ACCESS_SECRET_KEY,
        options:{expiresIn:60*5}
    })
    const refresh_token = generateToken({
        payload:{id:user._id,email:user.email},
        secret_key:REFRESH_SECRET_KEY,
        options:{expiresIn:"1day"}
    })
    successeResponsive({res,status:200,data:{access_token,refresh_token}})
}


export const getProfile = async (req,res,next)=>{
    successeResponsive({res,data:req.user})
}


export const shareProfile = async (req,res,next)=>{
    const {id} = req.params
    const user = await db_service.findById({model:userModel,filter:id,select:"-password"})
    if (!user) {
        throw new Error("user not exist");
    }
    user.phone=decrypt(user.phone)
    successeResponsive({res,data:user})
}


export const refreashToken = async (req,res,next)=>{
    const {authorization} = req.headers
    if (!authorization) {
        throw new Error("Token Not Found");
    }
    const [prefix,token] = authorization.split(" ")
    if (prefix !== PREFIX) {
        throw new Error("inValid prefix");
    }
    const decoded = verifyToken({token,secret_key:REFRESH_SECRET_KEY})
    if (!decoded || !decoded ?.id) {
        throw new Error("inValid Token");
    }

    const user = await db_service.findOne({model:userModel,filter:{_id:decoded.id},select:"-password"})
    if (!user) {
        throw new Error("user Not Found",{cause:409});
    }

    
    const access_token = generateToken({
        payload:{id:user._id,email:user.email},
        secret_key:ACCESS_SECRET_KEY,
        options:{expiresIn:"1day"}
    })

    successeResponsive({res,data:access_token})
}

