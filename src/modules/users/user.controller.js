import { Router } from "express";
import * as US from "./user.service.js"
import * as UV from "./user.validation.js";
import { authentication } from "../../common/middleware/authentication.js";
import { authorization } from "../../common/middleware/authorization.js";
import { roleEnum } from "../../common/Enum/user.enum.js";
import { validation } from "../../common/middleware/validations.js";
import { multer_host, multer_local } from "../../common/middleware/multer.js";
import { multer_enum } from "../../common/Enum/multer.enum.js";
const userRouter =  Router()


// local multer
// userRouter.post("/signUp",
//     multer_local({costume_file:"users",costume_types:[...multer_enum.image]})
//     .single("attachment"),
//     US.signUp)   

// cloudinary || signUp Send Otp
userRouter.post("/signUp",
    multer_host([...multer_enum.image]).single("attachment"),
    validation(UV.signUpSchema),
US.signUp)

// signUp||signIn  With Gmail
userRouter.post("/signup/gmail",US.signUpWithGmail)             

// signIn 
userRouter.post("/signIn",validation(UV.signInSchema),US.signIn)
// enable2FA
userRouter.post("/enable2FA",authentication,US.enable2FA)
// confirm2FA
userRouter.patch("/confirm2FA",authentication,US.confirm2FA)
// confirm login with 2Fa
userRouter.post("/confirm-login",authentication,US.confirmLogin)
// confirm Email with Otp
userRouter.patch("/confirm-email",validation(UV.confirmEmailSChema),US.confirmEmail)  
// resendOtp           
userRouter.post("/resendOtp",validation(UV.resendOtpSChema),US.resendOtp) 
// getProfile   
userRouter.get("/profile",authentication,authorization([roleEnum.user,roleEnum.admin]),US.getProfile)
// shareProfile
userRouter.get("/share-profile/:id",validation(UV.shareProfileSchema),US.shareProfile)
// updateProfile
userRouter.patch("/update-profile",authorization([roleEnum.user]),validation(UV.updateProfileSchema),authentication,US.updateProfile)
// updatePassword
userRouter.patch("/update-password",authorization([roleEnum.user]),validation(UV.updatePasswordSchema),authentication,US.updatePassword)
// refreashToken
userRouter.get("/refresh-token",US.refreashToken)
// logout from one device or all devices
userRouter.post("/logout",authentication,US.logout)

export default userRouter