const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const userSchema = Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  // Place 쪽에서는 하나의 객체가 데이터 하나기 때문에 상관없지만, User 쪽에서는 하나의 유저가 여러 개의 데이터를 가질 수 있기 때문에 배열로 감싸준다.
  likes: [
    {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "Like",
    },
  ],
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
