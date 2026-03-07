
import multer from "multer";
import fs from "node:fs"


export const multer_local = ({ costume_file="general", costume_types=[]}={})=>{
    const full_path =  `uploads/${costume_file}`
    if (!fs.existsSync(full_path)) {
        fs.mkdirSync(full_path,{recursive:true})
    }
    const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null,full_path)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null,uniqueSuffix + "_" + file.originalname)
    }
    })
    function fileFilter (req, file, cb) {
        if(!costume_types.includes(file.mimetype)){
            cb(new Error("inValid file type"))
        }
        cb(null,true)
    }

    const upload = multer({ fileFilter,storage })
    return upload
}



export const multer_host = ( costume_types=[])=>{
    const storage = multer.diskStorage({})
    function fileFilter (req, file, cb) {
        if(!costume_types.includes(file.mimetype)){
            cb(new Error("inValid file type"))
        }
        cb(null,true)
    }

    const upload = multer({ fileFilter,storage })
    return upload
}



export const deleteFileMulterLocal = (req)=>{
    if (req.file?.path) {
        fs.unlinkSync(req.file.path)
    }
    if (Array.isArray(req.files)) {
        req.files.forEach((file) => {
            fs.unlinkSync(file.path)
        });
    }
    if (req.files && typeof(req.files)==="object") {
        Object.values(req.files).forEach((files)=>{
            files.forEach((file)=>{
                fs.unlinkSync(file.path)
            })
        })
    }
}