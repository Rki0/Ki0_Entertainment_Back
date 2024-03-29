const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const Like = require("../models/Like");
const User = require("../models/User");

const addLike = async (req, res, next) => {
  const { src, name } = req.body;

  let existingLike;

  try {
    existingLike = await Like.findOne({
      src: src,
      creator: req.userData.userId,
    });
  } catch (err) {
    const error = new HttpError("compare failed..", 500);

    return next(error);
  }

  if (existingLike) {
    const error = new HttpError("You already add this artist!", 402);

    return next(error);
  }

  const createdLike = new Like({
    src,
    name,
    creator: req.userData.userId,
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      "Cannot find user to update like list, please try again.",
      500
    );

    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id", 404);

    return next(error);
  }

  try {
    // 데이터 Id를 저장하는 것과 유저 데이터에 해당 데이터 id를 연결하는 것이 모두 성공해야지만 유효한 데이터가 될 수 있다.
    // session의 transaction을 사용하여 모든 조건이 성공했을 때만 데이터가 변경되도록 만들자.
    // transaction의 경우에는 컬렉션이 존재하지않는 경우 자동 생성하고 데이터를 저장하는게 아니라서, 컬렉션을 만들어놓고 수행해줘야한다.(수동 설정 ㅇㅇ)
    const sess = await mongoose.startSession();
    sess.startTransaction();

    await createdLike.save({ session: sess });

    // 여기서의 push는 js api가 아니라 mongoose에서 제공하는 것으로, 참조하는 두 개의 모델을 연결할 수 있게 해준다.
    // user 모델의 places 속성에 createdPlace를 넣는다.
    user.likes.push(createdLike);

    await user.save({ session: sess });

    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Creating place failed, please try again.",
      500
    );

    return next(error);
  }

  // 새로 등록하는 api 통신 성공은 201이 관례
  res.status(201).json({ like: createdLike });
};

const loadLike = async (req, res, next) => {
  const userId = req.params.userId;

  let userWithLikes;
  try {
    userWithLikes = await User.findById(userId).populate("likes");
  } catch (err) {
    const error = new HttpError(
      "Fetching places failed, please try again later",
      500
    );

    return next(error);
  }

  // 에러 처리를 위해 next를 사용하는 경우 - 라우터가 비동기적으로 작동할 때 사용
  if (!userWithLikes) {
    return next(
      new HttpError("Could not find a places for the provided userId.", 404)
    );
  }

  res.json({
    likeList: userWithLikes.likes.map((like) =>
      like.toObject({ getters: true })
    ),
  });
};

const deleteLike = async (req, res, next) => {
  const likeId = req.params.likeId;

  let like;
  try {
    // user 모델에 연결되어 있는 데이터이므로 places 컬렉션에서 삭제하면 user 컬렉션 내에서도 그 데이터를 지워줘야함.
    // 이 때, populate()를 사용한다. 이는 각 모델 스키마에서 ref로 서로를 참조한 경우에만 사용할 수 있다.
    // creator 속성에 user 데이터의 ObjectId를 넣어놨는데, 그를 활용하여 해당 user 데이터를 사용할 수 있음.
    like = await Like.findById(likeId).populate("creator");
  } catch (err) {
    const error = new HttpError("Cannot find like one. Please try again.", 500);

    return next(error);
  }

  if (!like) {
    const error = new HttpError("Cannot find like.", 404);

    return next(error);
  }

  if (like.creator.id !== req.userData.userId) {
    const error = new HttpError(
      "You are not allowed to delete this place.",
      // 403 : 접근 권한이 없다. 인증되지 않은 상태
      // 401 : 인증은 마쳤으나, 작업 실행 권한이 없는 경우.
      401
    );

    return next(error);
  }

  try {
    const sess = await mongoose.startSession();

    sess.startTransaction();

    await like.remove({ session: sess });

    // pull은 자동으로 id를 제거한다.
    // creator에 pull을 적용할 수 있는 것은 앞서 populate()를 사용해 creator로 user 데이터를 사용할 수 있게 해줬기 때문이다.
    like.creator.likes.pull(like);

    await like.creator.save({ session: sess });

    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete place.",
      500
    );

    return next(error);
  }

  res.status(200).json({
    message: "Deleted place",
  });
};

exports.addLike = addLike;
exports.loadLike = loadLike;
exports.deleteLike = deleteLike;
