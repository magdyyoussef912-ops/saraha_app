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
import { block_otp_key, block_password_key, del, FA_key, get, Incr, keys, login_key, max_otp_key, max_pass_key, otp_key, revoked_id_token, revoked_token, setValue, ttl } from '../../DB/redis/redis.service.js';
import cloudinary from "../../common/utils/cloudinary.js"
import { generateOtp, sendEmail } from '../../common/utils/email/sendEmail.js';
import { sendEmailOtp } from '../../common/utils/email/send.email.otp.js';
import emailEnum from '../../common/Enum/email.enum.js';
import {  eventEmitter } from '../../common/utils/email/email.events.js';

export const signUp =  async(req,res,next)=>{
    const {userName,email,password,cPassword,age,gender,provider,phone} = req.body

    if (password !== cPassword) {
        throw new Error("inValid cPassword",{cause:409});        
    }

    const {secure_url,public_id} = await cloudinary.uploader.upload(req.file.path,{
        folder:"saraha_app/users",
        resource_type:"image"
    })

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
        }})


    eventEmitter.emit(emailEnum.confirmEmail,async ()=>{   
        const otp =await generateOtp() 
        await sendEmail({
            to:email,
            subject:`Hello ${userName}`,
            html: `<h1>Hello ${userName} </h1>
            <p>welcome to sarha app your otp is: ${otp}</p>` 
        })
        
        await setValue({key:otp_key({email,subject:emailEnum.confirmEmail}),value:Hash({plainText:`${otp}`}),ttl:60*2})
        await setValue({key:max_otp_key({email}),value:1,ttl:30})
    } )

    successeResponsive({res,message:"Done Create",data:user})
}

export const confirmEmail = async (req,res,next)=>{
    const {otp,email} = req.body

    const otpValue = await get(otp_key({email,subject:emailEnum.confirmEmail}))

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

    await sendEmailOtp({email,subject:emailEnum.confirmEmail})

    successeResponsive({res,message:"otp Resend Successfully"})
}

export const resetPassword = async (req,res,next)=>{
    const {email,otp,password} = req.body

    const otpValue = await get(otp_key({email,subject:emailEnum.forgotPassword}))

    if (!otpValue) {
        throw new Error("otp expired");        
    }

    if (!Compare({plainText:`${otp}`,cipherText:`${otpValue}`})) {
        throw new Error("inValid otp");        
    }

    const user = await db_service.findOneAndUpdate({
        model:userModel,
        filter:{
            email,
            provider:providerEnum.system,
            confirmed:{$exists:true}
        },
        update:{password:Hash({plainText:password})}
    })
    if (!user) {
        throw new Error("user Not Exist");        
    }

    await del(otp_key({email,subject:emailEnum.forgotPassword}))

    successeResponsive({res,message:"Password Reset Successfully"})
}

export const forgetPassword = async (req,res,next)=>{
    const {email} = req.body

    const user = await db_service.findOne({
        model:userModel,
        filter:{
            email,
            provider:providerEnum.system,
            confirmed:{$exists:true}
        }
    })
    if (!user) {
        throw new Error("user Not Exist");        
    }

    await sendEmailOtp({email,subject:emailEnum.forgotPassword})

    successeResponsive({res,message:"otp Sent Successfully"})
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

export const enable2FA = async (req,res,next)=>{
    const user = await db_service.findOne({
        model:userModel,
        filter:{email:req.user.email,twoFactorEnabled:{$exists:false}}
    })
    if (!user) {
        throw new Error("user Not exist");
    }
    const otp = await generateOtp()

    await setValue({key:FA_key({email:req.user.email}),value:Hash({plainText:`${otp}`}),ttl:60*10})

    await sendEmail({
        to:req.user.email,
        subject:` welcome in Saraha App`,
        html: `<h1>hello ${req.user.firstName} ${req.user.lastName} </h1>
        <p>welcome to sarha app your otp is: ${otp}</p>`  
    })

    successeResponsive({res,message:"Otp Sent"})
}

export const confirm2FA = async (req,res,next)=>{
    const {otp} = req.body

    const otpValue = await get(FA_key({email:req.user.email}))
    if (!otpValue) {
        throw new Error("otp Expired");        
    }

    if (!Compare({plainText:`${otp}`,cipherText:`${otpValue}`})) {
        throw new Error("inValid otp");
    }

    const user =  await db_service.findOneAndUpdate({
        model:userModel,
        filter:{email:req.user.email,twoFactorEnabled:{$exists:false}},
        update:{twoFactorEnabled:true}
    })
    if (!user) {
        throw new Error("user Not Exist");
    }

    await del(FA_key({email:req.user.email}))

    successeResponsive({res,message:"confirm 2Fa succssefully"})
}

export const signIn = async (req ,res, next)=>{
    const {email , password} = req.body

    const user = await db_service.findOne({model:userModel,filter:{email,confirmed:{$exists:true},provider:providerEnum.system}})
    if (!user) {
        throw new Error("user Not Found",{cause:409})        
    }

    const block_password = await get(block_password_key({email}))
    if (block_password >0) {
        throw new Error(`you are blocked, plz try again after ${await ttl (block_password_key({email}))} `);
    }

    if (!Compare({plainText:password,cipherText:user.password})) {
        const max_tries_passw =  await Incr(max_pass_key({email}))
        if (max_tries_passw >= 5 ) {
            await setValue({key:block_password_key({email}),value:1,ttl:60*5})
            throw new Error("you have exceeded the maximum number of tries");
        }
        throw new Error("inValid Password",{cause:409});
    }

    if (user.twoFactorEnabled) {
        const otp = await generateOtp()

        await setValue({key:login_key({email}),value:Hash({plainText:`${otp}`}),ttl:60*10})

        await sendEmail({
            to:email,
            subject:` welcome in Saraha App`,
            html: `<h1>hello ${user.firstName} ${user.lastName} </h1>
            <p>welcome to sarha app your confirmOtp is: ${otp}</p>`  
        })

        successeResponsive({res,message:"Otp Sent"})

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

    await del(max_pass_key({email}))

    successeResponsive({res,status:200,data:{access_token,refresh_token}})
}

export const confirmLogin = async (req,res,next)=>{
    const {otp} = req.body

    const otpValue = await get(login_key({email:req.user.email}))
    if (!otpValue) {
        throw new Error("otp Expired");
    }

    if (!Compare({plainText:`${otp}`,cipherText:`${otpValue}`})) {
        throw new Error("inValid otp");
    }

    const jwtid = randomUUID()
    const access_token = generateToken({
        payload:{id:req.user._id,email:req.user.email},
        secret_key:ACCESS_SECRET_KEY,
        options:{expiresIn:60 * 3,
            jwtid
        }
    })

    const refresh_Token = generateToken({
        payload:{id:req.user._id},
        secret_key:REFRESH_SECRET_KEY,
        options:{expiresIn:"5h",
            jwtid
        } 
    })

    await del(login_key({email:req.user.email}))

    successeResponsive({res,status:201,data:{access_token,refresh_Token}})
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

    if(!Compare({plainText:lPassword,cipherText:req.user.password})){
        throw new Error("inValid password");        
    }

    const hash = Hash({plainText:nPassword})
    req.user.changeCredential = new Date()
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

