const mongoose = require("mongoose")
const Schema = mongoose.Schema
let wallet = new Schema({
    _id : String,
    proc: Array , 
    title : String , 
    users: Array , 
    amount : Number , 
    goal : Number , 
    lists : Object
})

const wallets = mongoose.model("wallets" , wallet)
module.exports = wallets