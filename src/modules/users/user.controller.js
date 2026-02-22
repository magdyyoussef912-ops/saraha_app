import { Router } from "express";
import * as US from "./user.service.js"
import { authentication } from "../../common/middleware/authentication.js";
import { authorization } from "../../common/middleware/authorization.js";
import { roleEnum } from "../../common/Enum/user.enum.js";
const userRouter =  Router()

userRouter.post("/signUp",US.signUp)             
userRouter.post("/signup/gmail",US.signUpWithGmail)             
userRouter.post("/signIn",US.signIn)
userRouter.get("/profile",authentication,authorization([roleEnum.user,roleEnum.admin]),US.profile)

export default userRouter