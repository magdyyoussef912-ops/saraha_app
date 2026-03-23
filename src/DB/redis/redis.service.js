import { redisClient } from "./redisDB.js";

export const revoked_token = ({userId,jti})=>{
    return `revoke_token::${userId}::${jti}`
}

export const revoked_id_token = ({userId})=>{
    return `revoke_token::${userId}`
}

export const otp_key = ({email})=>{
    return `otp::${email}`
}

export const max_otp_key = ({email})=>{
    return `otp::${email}::max_tries`
}

export const block_otp_key = ({email})=>{
    return `otp::${email}::block`
}

export const block_password_key = ({email})=>{
    return `signin::${email}::block_password`
}

export const max_pass_key = ({email})=>{
    return `signin::${email}::max_tries_pass`
}

export const FA_key = ({email})=>{
    return `2FA::${email}`
}

export const login_key = ({email})=>{
    return `login_key::${email}`
}


export  const  setValue = async ({key,value,ttl})=>{
    try {
        const data = typeof(value) == "string" ? value : JSON.stringify(value)
        return  ttl ? await redisClient.set(key,data,{EX:ttl}) :  await redisClient.set(key,data)
    } catch (error) {
        console.log(error,"fail to set operation");        
    }
}

export  const  update = async ({key,value})=>{
    try {
        if(!await redisClient.exists(key)) return 0
        return await setValue({key,value})
    } catch (error) {
        console.log(error,"fail to set operation");        
    }
}

export  const  get = async (key)=>{
    try {
        try {
            return await JSON.parse(redisClient.get(key))
        } catch (error) {
            return await redisClient.get(key)
        }
    } catch (error) {
        console.log(error,"fail to set operation");        
    }
}

export  const  ttl = async (key)=>{
    try {
        return await redisClient.ttl(key)
    } catch (error) {
        console.log(error,"fail to ttl operation");        
    }
}

export  const  exists = async (key)=>{
    try {
        return await redisClient.exists(key)
    } catch (error) {
        console.log(error,"fail to exists operation");        
    }
}

export  const  expire = async ({key,ttl})=>{
    try {
        return await redisClient.expire(key,ttl)
    } catch (error) {
        console.log(error,"fail to expire operation");        
    }
}

export  const  del = async (key)=>{
    try {
        if (!key.length) return 0
        return await redisClient.del(key)
    } catch (error) {
        console.log(error,"fail to del operation");        
    }
}

export  const  keys = async (pattern)=>{
    try {
        return await redisClient.keys(`${pattern}*`)
    } catch (error) {
        console.log(error,"fail to keys operation");        
    }
}
