const express = require("express");
const app = express();
const port = process.env.PORT || 5000;

const cors = require("cors");

app.use(
  cors({ origin: "https://ki0entertainment.netlify.app", credentials: true })
);

// app.use(cors({ origin: "http://localhost:3000", credentials: true }));

const { User } = require("./models/User");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// mongoose
const mongoose = require("mongoose");

const config = require("./config/key");

mongoose
  .connect(config.mongoURI)
  .then(() => console.log("MongoDB Connected..."))
  .catch((err) => console.log("Error", err));

// session
const session = require("express-session");
const fileStore = require("session-file-store")(session);

app.use(
  session({
    secret: config.cookieSecret,
    resave: false,
    saveUninitialized: false,
    store: new fileStore(),
    cookie: {
      // expires: 60 * 60 * 24,
      maxAge: 3.6e6 * 24,
      secure: false, // https 에서만 가져오도록 할 것인가?
    },
  })
);

// 회원가입 라우터
app.post("/api/users/register", (req, res) => {
  // const user = new User(req.body);
  const newUser = new User(req.body);

  // 데이터베이스에 같은 이메일이 존재한다면
  User.findOne({ email: req.body.email }, (err, user) => {
    // 회원가입을 진행시키면 안되므로 데이터와 함께 return
    if (user) {
      return res.json({
        success: false,
        message: "이미 가입된 이메일입니다.",
        error: err,
      });
    }

    // 그게 아니라면 데이터 저장 후 성공 메세지 return
    newUser.save((err, userInfo) => {
      return res.status(200).json({
        success: true,
      });
    });
  });
});

// 로그인 라우터
const cookieParser = require("cookie-parser");
app.use(cookieParser());

app.post("/api/users/login", (req, res) => {
  User.findOne({ email: req.body.email }, (err, user) => {
    if (!user) {
      return res.json({
        loginSuccess: false,
        message: "입력된 이메일에 해당하는 유저가 없습니다.",
      });
    }

    user.comparePassword(req.body.password, (err, isMatch) => {
      if (!isMatch) {
        return res.json({
          loginSuccess: false,
          message: "비밀번호가 틀렸습니다.",
        });
      }

      // 아이디, 비밀번호 일치 시 유저 정보가 들어있는 세션 생성
      req.session.email = req.body.email;
      req.session.logined = true;

      // 모델 만들 때 role은 디폴트 값을 0으로 설정되게 했으므로, 그걸 가져와서 사용
      req.session.role = user.role;

      // 추가 사항. 세션 정보를 저장하는 것. auth 미들웨어에서 req.session에 여기서 입력한 유저 데이터가 사라지는 현상을 해결하기 위한 시도.
      req.session.save((err) => {
        if (err) {
          return res.json({
            sessionGenerate: false,
            message: "세션 생성 실패",
          });
        }
      });

      return res.status(200).json({
        loginSuccess: true,
        email: req.session.email,
      });
    });
  });
});

// 인증 라우터
const { auth } = require("./middleware/check-auth");

// auth에 req.session을 전달하기 힘드니까...그냥 post로 바꿔서 리덕스에 있는 loginSuccess를 전달해줄까..?
// app.get("/api/users/auth", auth, (req, res) => {
//   res.status(200).json({
//     isAdmin: req.user.role === 0 ? false : true,
//     isAuth: true,
//     email: req.session.email,
//     authSuccess: true,
//   });
// });

app.post(
  // post로 바꾸고, 리덕스에서 loginSuccess 데이터를 전달받자
  "/api/users/auth",
  (req, res, next) => {
    // req에서 받아온 로그인 여부가 true이면 true, 비로그인이면 false를 할당해보자.
    req.session.logined = req.body.loginSuccess ? true : false;

    next(); // auth 미들웨어로 이동. 과연 session은 어떻게 될까?
  },
  auth,
  (req, res) => {
    return res.status(200).json({
      isAdmin: req.user.role === 0 ? false : true,
      isAuth: true,
      email: req.session.email,
      authSuccess: true,
    });
  }
);

// 로그아웃 라우터
app.get("/api/users/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.json({ logoutSuccess: false, error: err });

    return res.status(200).json({
      logoutSuccess: true,
      message: "로그아웃 성공",
    });
  });
});

// 관심 아티스트 추가 라우터
const { Like } = require("./models/Like");

app.post("/api/users/like", (req, res) => {
  const newLike = new Like(req.body);

  // 만약 같은 아티스트를 추가한다면
  Like.findOne({ name: req.body.name, email: req.body.email }, (err, like) => {
    // 추가하면 안되므로 데이터와 함께 return
    if (like) {
      return res.json({
        addLikeSuccess: false,
        message: "이미 관심 설정된 아티스트입니다.",
        error: err,
      });
    }

    // 그게 아니라면 데이터 저장 후 성공 메세지 return
    newLike.save((err, likeInfo) => {
      if (err) return res.json({ addLikeSuccess: false, error: err });

      return res.status(200).json({
        addLikeSuccess: true,
      });
    });
  });

  // newLike.save((err, likeInfo) => {
  //   if (err) return res.json({ addLikeSuccess: false, error: err });

  //   res.status(200).json({
  //     addLikeSuccess: true,
  //   });
  // });
});

// 관심 아티스트 불러오기 라우터
app.post("/api/users/loadlike", (req, res) => {
  Like.find({ email: req.body.email }, (err, like) => {
    if (err) return res.json({ loadLikeSuccess: false, error: err });

    res.status(200).json({
      loadLikeSuccess: true,
      myLike: like,
    });
  });
});

// 관심 아티스트 삭제하기
app.post("/api/users/deletelike", (req, res) => {
  Like.deleteOne(
    { email: req.body.email, name: req.body.name },
    (err, like) => {
      if (err) return res.json({ deleteLikeSuccess: false, error: err });

      res.status(200).json({
        deleteLikeSuccess: true,
      });
    }
  );
});

app.get("/", (req, res) => {
  if (!req.session.num) {
    // 해당 세션키가 없다면
    req.session.num = 1; // 세션 생성
  } else {
    req.session.num = req.session.num + 1;
  }

  res.send("Hello World! 네트리파이 성공했어!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
