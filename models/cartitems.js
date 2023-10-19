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


const cartItemSchema = new mongoose.Schema({
    itemId: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    }
  });
  
  const cartSchema = new mongoose.Schema({
    userId: {
      type: String,
      required: true,
    },
    cartItems: [cartItemSchema], // Array to store cart items
  });
  
  const cartItems = mongoose.model('Cart', cartSchema);

module.exports=cartItems;