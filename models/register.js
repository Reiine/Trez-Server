const mongoose = require('mongoose');
mongoose
.connect('mongodb://127.0.0.1:27017/trezData')
.then(()=>{
    console.log("mongoose connected")
}).catch((e)=>{
    console.log("can't connect to mongoose");
})


const regUser = new mongoose.Schema({
    email:{
        type:String,
        required:true
    },
    name:{
        type:String,
        required:true
    },
    gender:{
        type:String,
        required:true
    },
    pass:{
        type:String,
        required:true
    },
    address:{
        type:String,
    }
})

const regUsers = new mongoose.model('regUsers', regUser);

module.exports=regUsers;
