const express = require("express");
const { check } = require("express-validator");

const checkAuth = require("../middleware/check-auth");
const userControllers = require("../controllers/user-controllers");

const router = express.Router();

router.post(
  "/signup",
  [
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 8 }),
  ],
  userControllers.signup
);

router.post("/login", userControllers.login);

router.use(checkAuth);

router.post("/withdraw", userControllers.withdraw);

router.post("/changePswd/:uid", userControllers.changePswd);

module.exports = router;
