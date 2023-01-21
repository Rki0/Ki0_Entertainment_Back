const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const port = process.env.PORT || 8080;

const likeRoutes = require("./routes/like-routes");
const usersRoutes = require("./routes/user-routes");
const HttpError = require("./models/http-error");
const config = require("./config/key");

const app = express();

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// fly.io setting
app.listen(port, "0.0.0.0");
console.log(`listening on port ${port}`);

// fly.io secrets setting
mongoose
  // .connect(config.mongoURI)
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.p7xg4td.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
  )
  .then(() => {
    console.log("Connect Success!");
  })
  .catch((err) => {
    console.log("Connect Fail...", err);
  });

// CORS 해결
app.use((req, res, next) => {
  // 두 번째 인자는 허용 도메인
  // res.setHeader("Access-Control-Allow-Origin", "*");
  // res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://ki0entertainment.netlify.app"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE");

  next();
});

app.use("/api/like", likeRoutes);
app.use("/api/users", usersRoutes);

// 응답을 보내지 않는 통신에 대해서 에러 처리
// 즉, 지원하지 않는 경로에 통신이 왔을 때 처리하는 것
app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  throw error;
});

// 경로 설정이 없으면 express가 모든 요청에 대해 처리하게 된다
// 따라서, 위에서 작성된 라우터에서 에러가 발생하면 여기서 에러 처리를 한다.
app.use((error, req, res, next) => {
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occured!" });
});
