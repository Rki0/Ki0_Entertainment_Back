const express = require("express");
const app = express();
const port = 5000;

const { User } = require("./model/User");

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

// 회원가입 라우터
app.post("/register", (req, res) => {
  const user = new User(req.body);

  user.save((err, userInfo) => {
    if (err) return res.json({ success: false, Error: err });

    return res.status(200).json({
      success: true,
    });
  });
});

app.get("/", (req, res) => {
  res.send("Hello World! 안녕하세요! 곤니찌와! Hi!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
