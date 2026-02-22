
import { verifyToken } from "../utils/token.service.js";
import  * as db_service from "../../DB/DB.service.js"
import userModel from "../../DB/models/user.model.js";


export const authentication = async (req ,res , next)=>{
    const {authorization} = req.headers
    if (!authorization) {
        throw new Error("Token Not Found");
    }
    const [prefix,token] = authorization.split(" ")
    if (prefix !== "test") {
        throw new Error("inValid prefix");
    }
    const decoded = verifyToken({token,secret_key:"secret"})
    if (!decoded || !decoded ?.id) {
        throw new Error("inValid Token");
    }
    console.log(decoded);
    

    const user = await db_service.findOne({model:userModel,filter:{_id:decoded.id},select:"-password"})
    if (!user) {
        throw new Error("user Not Found",{cause:409});
    }
    req.user = user
    next()
} 
