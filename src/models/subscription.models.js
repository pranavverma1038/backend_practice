import mongoose from "mongoose";


const subscriptionSchema = new Schema({
    subscriber:{
        type:Schema.Types.ObjectId, //one who is subscribing
        ref:"User"
    },
    //one to whom is subscribing
    channel:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},{Timestamps:true})

export const Subscription = mongoose.model("Subscription",subscriptionSchema)