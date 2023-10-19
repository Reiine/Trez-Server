const mongoose = require('mongoose');
const dotEnv = require("dotenv");
dotEnv.config();
mongoose
  .connect(`${process.env.MONGOURL}`)
.then(()=>{
    console.log("mongoose connected")
}).catch((e)=>{
    console.log("can't connect to mongoose");
})

const prod = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    brand:{
        type:String,
        required:true
    },
    hash:{
        type:Array,
        required:true
    },
    tag:{
        type:String,
        required:true
    },
    des:{
        type:String,
        required:true
    },
    img:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    }
})

const products = new mongoose.model('products', prod);

module.exports=products;