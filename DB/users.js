const mongoose = require("mongoose")
const Schema = mongoose.Schema
let user = new Schema({
    _id : Number,
    username : String , 
    name : String , 
    img : String , 
    wallets : Array , 
    pass : String , 
    token : String , 
    color : String
})

const users = mongoose.model("users" , user)
module.exports = users