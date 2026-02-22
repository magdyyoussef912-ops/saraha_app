
import express from "express"
import cors from "cors"
import { successeResponsive } from "./common/utils/successResponsive.js"
import checkConectionDb from "./DB/connectionDB.js"
import userRouter from "./modules/users/user.controller.js"
import { PORT } from "../config/config.service.js"
const app = express()
const port = PORT

const bootstrap = ()=>{
    app.use(cors(),express.json())
    app.get("/",(req,res,next)=>{
        successeResponsive({res,status:201,message:"welcome in our server"})
    })
    checkConectionDb()
    app.use("/users",userRouter)
    app.listen(port,()=>{
        console.log(`server is running at port ${port}`);
    })
    app.use("{/*demo}",(req,res,next)=>{
        throw new Error(`404 url ${req.originalUrl} is Not Found`,{cause:404});
    })
    app.use((err,req,res,next)=>{
        return res.status(err.cause || 500).json({message:err.message,stack:err.stack})
    })
}

export default bootstrap