const express = require("express");
const { User, validate, schema } = require("../models/user");
const bcrypt = require("bcrypt");
const router = express.Router();
const _ = require("lodash");
const addObjectIds = require("../utils/addObjectIds");
const mongoose = require("mongoose");
const {
  ioUpdateToAllActiveUsers,
  ioUpdateToByRoomId,
} = require("../utils/WebSockets");
const { Room } = require("../models/room");
const auth = require("../middleware/auth");

router.post("/create_user", auth, async (req, res) => {
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("User already registered.");

  user = await User.create(
    _.pick(req.body, [
      "email",
      "password",
      "firstName",
      "lastName",
      "phone",
      "displayName",
      "accountType",
      "status",
    ])
  );
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);

  await user.save();

  const token = user.generateAuthToken();

  const newUser = await User.findById(
    user._id,
    "-password -last_seen_messages -contacts"
  ).lean();

  const action = "newUser";
  ioUpdateToAllActiveUsers(action, newUser);

  res
    .header("x-auth-token", token)
    .header("access-control-expose-headers", "x-auth-token")
    .send(_.pick(user, ["_id", "name", "email"]));
});

router.get("/all", auth, async (req, res) => {
  const users = await User.find({});
  if (!users) return res.status(404).send("Users not found");

  const usersObjects = addObjectIds(users);
  res.send(usersObjects);
});

router.get("/delete_user/:id", auth, async (req, res) => {
  const userId = req.params.id;
  const userData = await User.find({ _id: userId });

  if (userData.length === 0) return res.status(404).send("User not found");

  await User.deleteOne({ _id: userId }).lean();
  const targetRooms = await Room.find({ members: { $all: [userId] } }).lean();

  var changeMembers = new Promise((resolve) => {
    let i = 0;

    targetRooms.forEach(async (room) => {
      const updatedRoomData = await Room.findByIdAndUpdate(
        { _id: room._id },
        { $pull: { members: userId } },
        { new: true }
      ).exec();

      // tämä yleiseen huoneiden muutokseen. Menee niille,
      //joillle kuuluu, eli on kyseinen huone
      ioUpdateToByRoomId([room._id], "membersChanged", updatedRoomData);

      i++;
      if (targetRooms.length === i) resolve();
    });
  });
  Promise.all([changeMembers]);

  ioUpdateToAllActiveUsers("userDeleted", { _id: userId });

  res.send(userId);
});

router.post("/edit_user_data", auth, async (req, res) => {
  const {
    accountType,
    firstName,
    lastName,
    displayName,
    email,
    phone,
    userId,
  } = req.body;

  const newUserData = await User.findOneAndUpdate(
    { _id: userId },
    { accountType, firstName, lastName, displayName, email, phone },
    { new: true }
  ).lean();

  const newUserObject = { _id: userId, newUserData };

  ioUpdateToAllActiveUsers("userDataEdited", newUserObject);

  res.status(200).send(newUserData);
});
router.post("/save_last_seen_message_sum", auth, async (req, res) => {
  const { currentUserId, roomId, lastSeenMessageSum } = req.body;

  // const a = await User.f({}{ "last_seen_message.roomId": roomId }).exec();
  const a = await User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(currentUserId) } },
  ]);

  console.log(
    a[0].last_seen_messages,
    "täältä joku onko id jos on updatee sen jos ei niin sitten lisää addtoset, muista päivittää erikseen current useriin "
  );

  // const newUserData = await User.findOneAndUpdate(
  //   { _id: currentUserId },
  //   {
  //     $addToSet: {
  //       last_seen_messages: { roomId, lastSeenMessageSum: lastSeenMessageSum },
  //     },
  //   },
  //   { new: true }
  // ).lean();

  res.status(200).send("newUserData");
  // res.status(200).send(newUserData);
});

router.post("/archive_or_delete_user", auth, async (req, res) => {
  const { userId, status } = req.body;

  await User.findOneAndUpdate(
    { _id: userId },
    { status },
    { new: true }
  ).lean();

  const targetRooms = await Room.find({ members: { $all: [userId] } });

  var changeMembers = new Promise((resolve) => {
    let i = 0;

    targetRooms.forEach(async (room) => {
      if (room.type === "private") return;

      const updatedRoomData = await Room.findByIdAndUpdate(
        { _id: room._id },
        { $pull: { members: userId } },
        { new: true }
      )
        .lean()
        .exec();

      ioUpdateToByRoomId(
        [room._id.toString()],
        "membersChanged",
        updatedRoomData
      );

      i++;
      if (targetRooms.length === i) resolve();
    });
  });
  Promise.all([changeMembers]);

  if (status === "archived") {
    ioUpdateToAllActiveUsers("userArchived", { _id: userId });
  } else {
    ioUpdateToAllActiveUsers("userTemporaryDeleted", { _id: userId });
  }
  res.send(userId);
});

router.get("/activate_user/:id", auth, async (req, res) => {
  const userId = req.params.id;

  const userData = await User.findOneAndUpdate(
    { _id: userId },
    { status: "active" },
    { new: true }
  ).lean();

  var changeMembers = new Promise((resolve) => {
    let i = 0;

    userData.userRooms.forEach(async (room) => {
      const updatedRoomData = await Room.findByIdAndUpdate(
        { _id: room },
        { $addToSet: { members: userId } },
        { new: true }
      )
        .lean()
        .exec();

      ioUpdateToByRoomId([room.toString()], "membersChanged", updatedRoomData);
      i++;
      if (userData.userRooms.length === i) resolve();
    });
  });
  Promise.all([changeMembers]);

  const activatedUser = await User.findById(
    userId,
    "-password -last_seen_messages -contacts"
  ).lean();

  ioUpdateToAllActiveUsers("userActivated", activatedUser);

  res.send(userId);
});

router.get("/:id", auth, async (req, res) => {
  const user = await User.findById(req.params.id).lean();
  if (!user) return res.status(404).send("User not found");

  res.send(user);
});

module.exports = router;
