const mongoose = require('mongoose');
const dotEnv = require("dotenv");
dotEnv.config();
mongoose
  .connect(`${process.env.MONGOURL}`)
  .then(() => {
    console.log('mongoose connected');
  })
  .catch((e) => {
    console.log("can't connect to mongoose");
  });

const yourOrder = mongoose.Schema({
  userId:{
    type: String,
    required: true
  },
  orderId: {
    type: String,
    required: true,
  },
  productId: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
  },
  orderStatus:{
    type: String,
    required: true,
    default: "Yet to confirm by seller",
  }

});

const yourOrderedItem = mongoose.model('your-orders', yourOrder);

module.exports = yourOrderedItem;
