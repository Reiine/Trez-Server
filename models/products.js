const mongoose = require('mongoose');
mongoose
.connect('mongodb://127.0.0.1:27017/trezData')
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