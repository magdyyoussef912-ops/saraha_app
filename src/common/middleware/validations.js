



export const validation = (schema)=>{
    return (req,res,next)=>{
        let error_result = []
        for (const key of Object.keys(schema)) {
            const {error} = schema[key].validate(req[key],{abortEarly:false})
            if (error) {
                error.details.forEach(element => {
                    error_result.push({
                        key,
                        path:element.path[0],
                        messsage:element.messsage
                    })
                });
            }            
        }
        if (error_result.length) {
            return res.status(500).json({messsage:"validation error",error_result})
        }
        next()
    }
}