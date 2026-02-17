import mongoose from "mongoose";

const checkConectionDb = async()=>{
    await mongoose.connect("mongodb://localhost:27017/saraha_app",{serverSelectionTimeoutMS:5000})
        .then(()=>{
            console.log(`success to connect DB......😘😘`);
        })
        .catch((err)=>{
            console.log(err,`failed to connect DB.................💔💔`);
        })
}

export default checkConectionDb