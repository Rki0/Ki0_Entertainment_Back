const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");
const User = require("../models/User");

const signup = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Sign up failed. Please try again.", 500);

    return next(error);
  }

  if (existingUser) {
    const error = new HttpError("You already sign up. Please use login.", 422);

    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError("Encrypt failed, please try again.", 500);

    return next(error);
  }

  const createdUser = new User({
    email,
    password: hashedPassword,
    likes: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(
      "Save user data failed. Please try again.",
      500
    );

    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Generating signup token is failed. Please try again",
      500
    );

    return next(error);
  }

  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Login failed, please try again later.", 500);

    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      403
    );

    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      "Could not log you in, please check your credentials and try again.",
      500
    );

    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      401
    );

    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError(
      "Logging up failed, please try again later.",
      500
    );

    return next(error);
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token,
  });
};

const withdraw = async (req, res, next) => {
  const { password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findById(req.userData.userId).populate("likes");
  } catch (err) {
    const error = new HttpError(
      "Something inputs wrong. Please try again.",
      422
    );

    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError("Cannot find user. Please try again.", 500);

    return next(error);
  }

  if (existingUser.id !== req.userData.userId) {
    const error = new HttpError("You are not allowed to delete info.", 401);

    return next(error);
  }

  let isValidPassword = false;

  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      "Could not find you, please check your credentials and try again.",
      500
    );

    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      "Invalid credentials, could not find you.",
      401
    );

    return next(error);
  }

  try {
    existingUser.likes.forEach((like) => {
      like.remove();
    });
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete all of you.",
      500
    );

    return next(error);
  }

  try {
    await existingUser.remove();
  } catch (err) {
    const error = new HttpError(
      "Cannot delete your info. Please try again.",
      500
    );

    return next(error);
  }

  res.status(201).json({ withdrawSuccess: true });
};

const changePswd = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  let existingUser;
  try {
    existingUser = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      "Something inputs wrong. Please try again.",
      422
    );

    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError("Cannot find user. Please try again.", 500);

    return next(error);
  }

  if (existingUser.id !== req.userData.userId) {
    const error = new HttpError("You are not allowed to change info.", 401);

    return next(error);
  }

  let isValidPassword = false;

  try {
    isValidPassword = await bcrypt.compare(
      currentPassword,
      existingUser.password
    );
  } catch (err) {
    const error = new HttpError(
      "Could not find you, please check your credentials and try again.",
      500
    );

    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      "Invalid credentials, could not find you.",
      401
    );

    return next(error);
  }

  if (newPassword === currentPassword) {
    const error = new HttpError("Inputed passwords aren't different.", 401);

    return next(error);
  }

  let hashedPassword;

  try {
    hashedPassword = await bcrypt.hash(newPassword, 12);
  } catch (err) {
    const error = new HttpError("Encrypt failed, please try again.", 500);

    return next(error);
  }

  try {
    await User.updateOne(
      { _id: existingUser._id },
      { password: hashedPassword }
    );
  } catch (err) {
    const error = new HttpError(
      "Update user data failed. Please try again.",
      500
    );

    return next(error);
  }

  res.status(201).json({ changeSuccess: true });
};

exports.signup = signup;
exports.login = login;
exports.withdraw = withdraw;
exports.changePswd = changePswd;
