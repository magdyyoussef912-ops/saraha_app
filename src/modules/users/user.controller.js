import { Router } from "express";
import * as US from "./user.service.js"
import { authentication } from "../../common/middleware/authentication.js";
import { authorization } from "../../common/middleware/authorization.js";
import { roleEnum } from "../../common/Enum/user.enum.js";
import { validation } from "../../common/middleware/validations.js";
import { signInSchema, signUpSchema } from "./user.validation.js";
import { multer_local } from "../../common/middleware/multer.js";
import { multer_enum } from "../../common/Enum/multer.enum.js";
const userRouter =  Router()

userRouter.post("/signUp",validation(signUpSchema),US.signUp)             
// userRouter.post("/signUp",multer_local({costume_file:"users",costume_types:[...multer_enum.image,...multer_enum.video]}).single("attachment"),US.signUp)             
userRouter.post("/signup/gmail",US.signUpWithGmail)             
userRouter.post("/signIn",validation(signInSchema),US.signIn)
userRouter.get("/profile",authentication,authorization([roleEnum.user,roleEnum.admin]),US.profile)

export default userRouter