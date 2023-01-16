const express = require("express");

const likeControllers = require("../controllers/like-controllers");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

router.use(checkAuth);

// 관심 아티스트 추가 라우터
router.post("/add", likeControllers.addLike);

// 관심 아티스트 불러오기 라우터
router.get("/load/:userId", likeControllers.loadLike);

// 관심 아티스트 삭제하기
router.delete("/delete/:likeId", likeControllers.deleteLike);

module.exports = router;
