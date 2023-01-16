const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const likeSchema = new Schema({
  src: {
    type: String,
  },
  name: {
    type: String,
  },
  creator: {
    // mongoDB의 데이터에 있는 id를 저장한다.
    type: mongoose.Types.ObjectId,
    required: true,
    // User 모델을 참조하도록 설정
    ref: "User",
  },
});

// 모델명은 보통 대문자로 시작하고, 복수형은 사용하지 않는다.
// MongoDB의 컬렉션에 소문자 복수형으로 바뀐 모델명이 추가되기 때문이다.
module.exports = mongoose.model("Like", likeSchema);
