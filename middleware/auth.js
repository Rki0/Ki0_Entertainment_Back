const { User } = require("../model/User");

const auth = (req, res, next) => {
  if (req.session.logined) {
    // session 정보에 들어가 있는 유저를 인증 유저로 설정?
    req.user = req.session;

    next();
  } else {
    return res.json({ isAuth: false, authSuccess: false });
  }
};

module.exports = { auth };
