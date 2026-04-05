import mongoose from "mongoose";
import {  DB_URI_ONLINE } from "../../config/config.service.js";

const checkConectionDb = async()=>{
    await mongoose.connect(DB_URI_ONLINE,{serverSelectionTimeoutMS:5000})
        .then(()=>{
            console.log(`success to connect DB ${DB_URI_ONLINE}......😘😘`);
        })
        .catch((err)=>{
            console.log(err,`failed to connect DB.................💔💔`);
        })
}

export default checkConectionDb