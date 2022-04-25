const express = require("express");
const { User, validate, schema } = require("../models/user");
const bcrypt = require("bcrypt");
const router = express.Router();
const _ = require("lodash");
const addObjectIds = require("../utils/addObjectIds");
const mongoose = require("mongoose");
const moment = require("moment");
const { ioUpdateToAllUsers, ioUpdateByRoomId } = require("../utils/WebSockets");
const { Room } = require("../models/room");
const auth = require("../middleware/auth");
const { AllMessages } = require("../models/allMessages");
const { AllTasks } = require("../models/allTasks");

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

  await AllTasks.create({ _id: newUser._id });
  ioUpdateToAllUsers("user", "newUser", newUser);
  res
    .header("x-auth-token", token)
    .header("access-control-expose-headers", "x-auth-token")
    .send(_.pick(user, ["_id", "name", "email"]));
});

router.post("/edit_password", auth, async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
  if (!password) return res.status(400).send("Please add a password.");

  let user = await User.findOne({ email });
  if (!user) return res.status(400).send("User not found.");

  const salt = await bcrypt.genSalt(10);

  const newPassword = await bcrypt.hash(password, salt);

  const newUserData = await User.findOneAndUpdate(
    { email },
    { password: newPassword },
    { new: true }
  ).lean();

  res.status(200).send(newUserData);
});

router.get("/all", auth, async (req, res) => {
  const users = await User.find({});
  if (!users) return res.status(404).send("Users not found");

  const usersObjects = addObjectIds(users);
  res.status(200).send(usersObjects);
});

router.get("/delete_user/:id", auth, async (req, res) => {
  const currentUserId = req.params.id;
  const userData = await User.find({ _id: currentUserId });

  if (userData.length === 0) return res.status(404).send("User not found");

  await User.deleteOne({ _id: currentUserId }).lean();
  await AllTasks.findOneAndUpdate(
    { _id: currentUserId },
    { changes: [] },
    { new: true }
  )
    .lean()
    .exec();
  const targetRooms = await Room.find({
    members: { $all: [currentUserId] },
  }).lean();

  var changeMembers = new Promise((resolve) => {
    let i = 0;

    targetRooms.forEach(async (room) => {
      const updatedRoomData = await Room.findByIdAndUpdate(
        { _id: room._id },
        { $pull: { members: currentUserId } },
        { new: true }
      ).exec();

      // tämä yleiseen huoneiden muutokseen. Menee niille,
      //joillle kuuluu, eli on kyseinen huone
      ioUpdateByRoomId([room._id], "room", "membersChanged", updatedRoomData);

      i++;
      if (targetRooms.length === i) resolve();
    });
  });
  Promise.all([changeMembers]);

  ioUpdateToAllUsers("user", "userDeleted", currentUserId);

  res.status(200).send(currentUserId);
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

  ioUpdateToAllUsers("user", "userDataEdited", newUserData, userId);

  res.status(200).send(newUserData);
});
router.post("/save_edited_user_data", auth, async (req, res) => {
  const { currentUserId, fieldName, value } = req.body.data;

  const newUserData = await User.findOneAndUpdate(
    { _id: currentUserId },
    { [fieldName]: value },
    { new: true }
  ).lean();

  ioUpdateToAllUsers("user", "userDataEdited", newUserData, currentUserId);

  res.status(200).send(newUserData);
});

router.post("/save_push_token", auth, async (req, res) => {
  const { currentUserId, currentUserPushToken } = req.body;

  const newUserData = await User.findOneAndUpdate(
    { _id: currentUserId },
    { pushNotificationToken: currentUserPushToken },
    { new: true }
  ).lean();

  // console.log(currentUserPushToken, "tämä token");
  // console.log(newUserData, "uusi data");
  res.status(200).send(newUserData);
});

router.post("/last_present", auth, async (req, res) => {
  const { currentUserId } = req.body;
  let user = await User.findById(currentUserId);
  //toki pitäisi löytyä, mutta on nyt joku viealla

  if (!user) return res.status(400).send("User do not exist.");

  const newUserData = await User.findOneAndUpdate(
    { _id: currentUserId },
    { last_present: moment().format() },
    { new: true }
  ).lean();

  res.status(200).send("present");
});
router.post("/get_last_user_last_present", auth, async (req, res) => {
  const { userId } = req.body;

  let { last_present } = await User.findById(userId);

  const userData = { userId, last_present };
  res.status(200).send(userData);
});
router.post("/get_unseen_message_sum", auth, async (req, res) => {
  const { currentUserId, roomId } = req.body;

  const { messageSum } = await Room.findById(roomId)
    .select("messageSum")
    .lean();
  const { last_seen_messages } = await User.findById(currentUserId)
    .select("last_seen_messages")
    .lean();

  const index = last_seen_messages.findIndex((room) => room.roomId === roomId);

  const newMessagesSum =
    index === -1
      ? messageSum
      : messageSum - last_seen_messages[index].lastSeenMessageSum;
  console.log(newMessagesSum);
  res.status(200).json({ newMessagesSum });
});

router.post("/save_last_seen_message_sum", auth, async (req, res) => {
  const { currentUserId, roomId, lastSeenMessageSum } = req.body;
  // console.log("katso ettei täällä ole turhaan");
  //testaile, ettei tarci olla updateMany
  await AllMessages.findOneAndUpdate(
    { _id: roomId },
    {
      $addToSet: {
        "messages.$[element].readByRecipients": { readByUserId: currentUserId },
      },
    },

    {
      arrayFilters: [
        {
          "element.readByRecipients.readByUserId": { $ne: currentUserId },
          "element.postedByUser": { $ne: currentUserId },
        },
      ],
    }
  ).exec();

  // tämä on ok tässä???? ettei erikseen functio webScketissa?
  io.to(roomId).emit("subscribe_read_at", true);

  const isLastSeenMessagesAlreadyAdded = await User.aggregate([
    {
      $match: {
        $and: [
          { _id: new mongoose.Types.ObjectId(currentUserId) },
          { "last_seen_messages.roomId": roomId },
        ],
      },
    },
  ]);

  if (isLastSeenMessagesAlreadyAdded.length === 0) {
    User.updateOne(
      { _id: currentUserId },
      {
        $addToSet: {
          userRooms: roomId,
          last_seen_messages: {
            roomId,
            lastSeenMessageSum: lastSeenMessageSum,
          },
        },
      }
    ).exec();
  } else {
    User.updateOne(
      { _id: currentUserId, "last_seen_messages.roomId": roomId },
      {
        $set: { "last_seen_messages.$.lastSeenMessageSum": lastSeenMessageSum },
      },
      { new: true }
    )
      .lean()
      .exec();
  }

  res.status(200).send("newUserData");
});

router.post("/archive_or_delete_user", auth, async (req, res) => {
  const { userId, status, currentUserId } = req.body;

  await User.findOneAndUpdate(
    { _id: userId },
    { status, last_seen_messages: [] },
    { new: true }
  ).lean();

  const targetRooms = await Room.find({ members: { $all: [userId] } });
  await AllTasks.findOneAndUpdate(
    { _id: userId },
    { changes: [] },
    { new: true }
  )
    .lean()
    .exec();

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

      ioUpdateByRoomId(
        [room._id.toString()],
        "room",
        "membersChanged",
        updatedRoomData,
        currentUserId
      );

      i++;
      if (targetRooms.length === i) resolve();
    });
  });
  Promise.all([changeMembers]);

  if (status === "archived") {
    ioUpdateToAllUsers("user", "userArchived", userId, currentUserId);
  } else {
    ioUpdateToAllUsers("user", "userTemporaryDeleted", userId, currentUserId);
  }
  res.status(200).send(userId);
});

router.post("/activate_user", auth, async (req, res) => {
  const { userId, currentUserId } = req.body;
  const userData = await User.findOneAndUpdate(
    { _id: userId },
    { status: "active" },
    { new: true }
  ).lean();

  //nämä functiot on myös roomsissa, voisiko olla static method
  userData.userRooms.forEach(async (roomId) => {
    const roomData = await Room.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(roomId) } },
      { $unwind: { path: "$_id" } },
      {
        $project: {
          messageSum: 1,
        },
      },
    ]);

    await User.findOneAndUpdate(
      { _id: userId },
      {
        $addToSet: {
          last_seen_messages: {
            roomId,
            lastSeenMessageSum: roomData[0]?.messageSum,
          },
        },
      },
      { new: true }
    )
      .lean()
      .exec();
  });

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

      ioUpdateByRoomId(
        [room.toString()],
        "room",
        "membersChanged",
        updatedRoomData,
        currentUserId
      );
      i++;
      if (userData.userRooms.length === i) resolve();
    });
  });
  Promise.all([changeMembers]);

  await User.findById(userId, "-password -last_seen_messages -contacts").lean();

  ioUpdateToAllUsers("user", "userActivated", userId, currentUserId);

  res.status(200).send(userId);
});

router.get("/:id", auth, async (req, res) => {
  const user = await User.findById(req.params.id).lean();
  if (!user) return res.status(404).send("User not found");

  res.status(200).send(user);
});

module.exports = router;
