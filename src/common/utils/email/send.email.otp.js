import { block_otp_key, get, Incr, max_otp_key, otp_key, setValue, ttl } from "../../../DB/redis/redis.service.js";
import { Hash } from "../security/hash.security.js";
import { generateOtp, sendEmail } from "./sendEmail.js";



export const sendEmailOtp = async ({email,subject}={}) => {

    const isBlocked = await get(block_otp_key({email}))
    if (isBlocked >0) {
        throw new Error(`you are blocked, plz try again after ${await ttl (block_otp_key({email}))}`);
    }

    const otpTTl = await ttl(otp_key({email,subject}))
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
        subject:`Welcome In Sarha App`,
        html: `<h1>welcome to sarha app your otp is: ${otp} </h1>` 
    })
    
    await setValue({key:otp_key({email,subject}),value:Hash({plainText:`${otp}`}),ttl:60*2})
    await Incr(max_otp_key({email}))
} 
