const mongoose = require('mongoose');

mongoose
  .connect('mongodb://127.0.0.1:27017/trezData')
  .then(() => {
    console.log('mongoose connected');
  })
  .catch((e) => {
    console.log("can't connect to mongoose");
  });

const commentSchema = mongoose.Schema({
  userId:{
    type: String,
    required : true
  },
  rating: {
    type: Number,
    required: true,
  },
  comment: {
    type: String,
  },
  user: {
    type: String,
    required: true,
  },
  productId: {
    type: String,
    required: true,
  },
  date: {
    year: {
      type: Number,
      default: () => new Date().getFullYear(),
    },
    month: {
      type: Number,
      default: () => new Date().getMonth()+1,
    },
    day: {
      type: Number,
      default: () => new Date().getDate(),
    },
  },
});

const userComment = mongoose.model('comment', commentSchema);

module.exports = userComment;
