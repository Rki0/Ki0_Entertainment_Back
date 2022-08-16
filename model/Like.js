const mongoose = require("mongoose");

const likeSchema = mongoose.Schema({
  email: {
    type: String,
  },
  src: {
    type: String,
  },
  name: {
    type: String,
  },
});

const Like = mongoose.model("Like", likeSchema);

module.exports = { Like };
