import { verifyToken } from "../utils/token.service.js";
import  * as db_service from "../../DB/DB.service.js"
import userModel from "../../DB/models/user.model.js";
import { ACCESS_SECRET_KEY, PREFIX } from "../../../config/config.service.js";
import { get, revoked_token } from "../../DB/redis/redis.service.js";


export const authentication = async (req ,res , next)=>{
    const {authorization} = req.headers
    if (!authorization) {
        throw new Error("Token Not Found");
    }
    const [prefix,token] = authorization.split(" ")
    if (prefix !== PREFIX) {
        throw new Error("inValid prefix");
    }
    const decoded = verifyToken({token,secret_key:ACCESS_SECRET_KEY})
    if (!decoded || !decoded ?.id) {
        throw new Error("inValid Token payload");
    }
    const user = await db_service.findOne({model:userModel,filter:{_id:decoded.id}})
    if (!user) {
        throw new Error("user Not Found",{cause:409});
    }
    if (user?.changeCredential?.getTime() > decoded.iat*1000) {
        throw new Error("inValid token");        
    }
    const revokeToken = await get(revoked_token({userId:user._id,jti:decoded.jti}))
    if (revokeToken) {
        throw new Error("inValid token revoked");        
    }
    req.user = user
    req.decoded = decoded
    next()
} 
