import {OAuth2Client} from 'google-auth-library';
import * as db_service from "../../DB/DB.service.js"
import userModel from "../../DB/models/user.model.js"
import { successeResponsive } from "../../common/utils/successResponsive.js"
import { Compare, Hash } from "../../common/utils/security/hash.security.js"
import { decrypt, encrypt } from "../../common/utils/security/encrypt.security.js"
import { providerEnum } from "../../common/Enum/user.enum.js"
import { generateToken, verifyToken } from "../../common/utils/token.service.js"
import { ACCESS_SECRET_KEY, PREFIX, REFRESH_SECRET_KEY } from '../../../config/config.service.js';
import {randomUUID} from "crypto"
import revokeTokenModel from '../../DB/models/revokeToken.js';
import { block_otp_key, del, get, keys, max_otp_key, otp_key, revoked_id_token, revoked_token, setValue, ttl } from '../../DB/redis/redis.service.js';
import cloudinary from "../../common/utils/cloudinary.js"
import { generateOtp, sendEmail } from '../../common/utils/email/sendEmail.js';

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

    const otp =await generateOtp() 
    await sendEmail({
        to:email,
        subject:`Hello ${userName}`,
        html: `<h1>Hello ${userName} </h1>
        <p>welcome to sarha app your otp is: ${otp}</p>` 
    })
    
    await setValue({key:otp_key({email}),value:Hash({plainText:`${otp}`}),ttl:60*2})
    await setValue({key:max_otp_key({email}),value:1,ttl:30})
    successeResponsive({res,message:"Done Create",data:user})
}

export const confirmEmail = async (req,res,next)=>{
    const {otp,email} = req.body

    const otpValue = await get(otp_key({email}))

    if (!otpValue) {
        throw new Error("otp expired");        
    }

    if (!Compare({plainText:`${otp}`,cipherText:`${otpValue}`})) {
        throw new Error("inValid otp");        
    }

    const user = await db_service.findOneAndUpdate({
        model:userModel,
        filter:{email,provider:providerEnum.system,confirmed:{$exists:false}},
        update:{confirmed:true}
    })

    if (!user) {
        throw new Error("user Not Exist");        
    }

    await del(otp_key({email}))

    successeResponsive({res,message:"Email Confirmed Successfully"})
}

export const resendOtp = async (req,res,next)=>{
    const {email} = req.body

    const user = await db_service.findOne({
        model:userModel,
        filter:{email,provider:providerEnum.system,confirmed:{$exists:false}}
    })

    if (!user) {
        throw new Error("user Not Exist");        
    }

    const isBlocked = await get(block_otp_key({email}))
    if (isBlocked >0) {
        throw new Error(`you are blocked, plz try again after ${await ttl (block_otp_key({email}))}`);
    }

    const otpTTl = await ttl(otp_key({email}))
    if (otpTTl > 0 ) {
        throw new Error(`Can't send otp after ${otpTTl} seconds`);        
    }

    const maxTries = await get(max_otp_key({email}))
    if (maxTries >=3) {
        await setValue({key:block_otp_key({email}),value:1,ttl:60*10})
        throw new Error("you have exceeded the maximum number of tries");
    }

    const otp =await generateOtp() 
    await sendEmail({
        to:email,
        subject:`Hello ${user.userName}`,
        html: `<h1>Hello ${user.userName} </h1>
        <p>welcome to sarha app your otp is: ${otp}</p>` 
    })
    
    await setValue({key:otp_key({email}),value:Hash({plainText:`${otp}`}),ttl:60*2})
    await Incr(max_otp_key({email}))

    successeResponsive({res,message:"Done"})
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
    const user = await db_service.findOne({model:userModel,filter:{email,confirmed:{$exists:true},provider:providerEnum.system}})
    if (!user) {
        throw new Error("user Not Found",{cause:409})        
    }
    if (!Compare({plainText:password,cipherText:user.password})) {
        throw new Error("inValid password",{cause:409});        
    }
    const jwtid = randomUUID()
    const access_token = generateToken({
        payload:{id:user._id,email:user.email},
        secret_key:ACCESS_SECRET_KEY,
        options:{expiresIn:60*3,
            jwtid
        }
    })
    const refresh_token = generateToken({
        payload:{id:user._id,email:user.email},
        secret_key:REFRESH_SECRET_KEY,
        options:{expiresIn:"1day",
            jwtid
        }
    })
    successeResponsive({res,status:200,data:{access_token,refresh_token}})
}

export const getProfile = async (req,res,next)=>{
    // const key = `profile::${req.user}`
    // const userExist = await get(key)
    // if (userExist) {
    //     successeResponsive({res,data:userExist})
    // }
    // await setValue({key,value:req.user,ttl:60})
    successeResponsive({res,data:{
        firstName:req.user.firstName,
        lastName:req.user.lastName,
        email:req.user.email,
        age:req.user.age,
        gender:req.user.gender,
        provider:req.user.provider,
        phone:decrypt(req.user.phone)
    }})
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

export const updateProfile = async (req,res,next)=>{
    let {firstName,lastName,gender,age,phone} = req.body
    if (phone) {
        phone=encrypt(phone)
    }
    const user = await db_service.findOneAndUpdate({
        model:userModel,
        filter:{_id:req.user._id},
        update:{firstName,lastName,gender,age,phone}
    })
    if (!user) {
        throw new Error("user not exist");
    }
    successeResponsive({res,data:user})
}

export const updatePassword = async (req,res,next)=>{
    const {lPassword,nPassword} = req.body

    // console.log(req.user.password);
    
    if(!Compare({plainText:lPassword,cipherText:req.user.password})){
        throw new Error("inValid password");        
    }
    
    const hash = Hash({plainText:nPassword})
    req.user.password = hash
    await req.user.save() 
    successeResponsive({res})
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

    const revokeToken = await db_service.findOne({model:revokeTokenModel,filter:{tokenId:decoded.jti}})
    if (revokeToken) {
        throw new Error("inValid token revoked");        
    }
    const access_token = generateToken({
        payload:{id:user._id,email:user.email},
        secret_key:ACCESS_SECRET_KEY,
        options:{expiresIn:"1day"}
    })

    successeResponsive({res,data:access_token})
}

export const logout = async (req,res,next)=>{
    const {flag} = req.query
    if (flag === "All") {
        req.user.changeCredential = new Date()
        await req.user.save()
        await del(await keys(revoked_id_token({userId:req.user._id})))
    }else{
        await setValue({
            key:revoked_token({userId:req.user._id,jti:req.decoded.jti}),
            value:`${req.decoded.jti}`,
            ttl: req.decoded.exp - Math.floor(Date.now()/1000)
        })
    }
    
    await req.user.save() 
    successeResponsive({res})
}

