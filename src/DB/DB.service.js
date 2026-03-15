


export const create =async ({model,data}={})=>{
    return await model.create(data)
}


export const findOne =async ({model,filter={},populate= [],select=""}={})=>{
    return await model.findOne(filter).populate(populate).select(select)
}


export const findById =async ({model,filter={},select=""}={})=>{
    return await model.findById(filter).select(select)
}

export const findOneAndUpdate =async ({model,filter={},update={new:true},options={}}={})=>{
    return await model.findOneAndUpdate(filter,update,options)
}

export const deleteMany =async ({model,filter={}}={})=>{
    return await model.deleteMany(filter)
}