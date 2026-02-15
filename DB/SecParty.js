const mongoose = require("mongoose")
const Schema = mongoose.Schema
let SecParty = new Schema({
    _id : Number,
    name : String , 
    date :  Date , 
    type : String ,
    amount : Number ,
    createdBy : String , 
    status : Boolean , 
    WID : String ,
})

const SecParties = mongoose.model("SecParties" , SecParty)
module.exports = SecParties