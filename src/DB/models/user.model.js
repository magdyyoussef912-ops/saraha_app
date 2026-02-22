import mongoose from "mongoose";
import { genderEnum, providerEnum, roleEnum } from "../../common/Enum/user.enum.js";

const userSchema = new mongoose.Schema({
    firstName:{
        type: String,
        trim:true,
        minLenght:3,
        required:true
    },
    lastName:{
        type: String,
        trim:true,
        minLenght:3,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },
    phone:{
        type:String
    },
    password:{
        type:String,
        required:function(){
            return this.provider == providerEnum.google ? false : true
        }
    },
    age:Number,
    gender:{
        type:String,
        enum: Object.values(genderEnum),
        default:genderEnum.male
    },
    provider:{
        type:String,
        enum: Object.values(providerEnum),
        default:  providerEnum.system
    },
    profilePicture:String,
    confirmed:Boolean,
    role:{
        type:String,
        enum:Object.values(roleEnum),
        default:roleEnum.user
    }
},{
    timestamps:true,
    strictQuery:true,
    toJSON:true,
    toObject:true
})

userSchema.virtual("userName")
    .get(function(){
        return this.firstName +" "+this.lastName
    })
    .set(function(v){
        const [firstName,lastName] = v.split(" ")
        this.set({firstName,lastName})
    })





const userModel = mongoose.models.user || mongoose.model("user",userSchema)

export default userModel