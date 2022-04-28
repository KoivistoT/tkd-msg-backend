const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const _ = require("lodash");
const addObjectIds = require("../utils/addObjectIds");
const bcrypt = require("bcrypt");
const { AllMessages } = require("../models/allMessages");
const { AllTasks } = require("../models/allTasks");
const { Room } = require("../models/room");
const { User, schema } = require("../models/user");
const { ioUpdateToAllUsers, ioUpdateByRoomId } = require("../utils/WebSockets");

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

  // res
  //   .header("x-auth-token", token)
  //   .header("access-control-expose-headers", "x-auth-token")
  //   .send(_.pick(user, ["_id", "name", "email"]));
  res.send(_.pick(user, ["_id", "name", "email"]));
});

router.post("/edit_password", auth, async (req, res) => {
  const { email, password } = req.body;

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

  const userObjects = addObjectIds(users);
  res.status(200).send(userObjects);
});

router.post("/edit_user_data", auth, async (req, res) => {
  const { userId } = req.body;
  const newUserData = await User.updateUserDataById(req.body);

  ioUpdateToAllUsers("user", "userDataEdited", newUserData, userId);

  res.status(200).send(newUserData);
});

router.post("/save_edited_user_data", auth, async (req, res) => {
  const { currentUserId, fieldName, value } = req.body.data;

  const newUserData = await User.updateOneField(
    currentUserId,
    fieldName,
    value
  );

  ioUpdateToAllUsers("user", "userDataEdited", newUserData, currentUserId);

  res.status(200).send(newUserData);
});

router.post("/get_last_user_last_present", auth, async (req, res) => {
  const { userId } = req.body;
  let { last_present } = await User.findById(userId);

  const userData = { userId, last_present };
  res.status(200).send(userData);
});

router.post("/save_last_seen_message_sum", auth, async (req, res) => {
  const { currentUserId, roomId, lastSeenMessageSum } = req.body;

  await AllMessages.addReadByRecipients(roomId, currentUserId);

  io.to(roomId).emit("subscribe_read_at", true);

  User.addReadByMessageSum(currentUserId, roomId, lastSeenMessageSum);

  res.status(200).send("newUserData");
});

router.post("/archive_or_delete_user", auth, async (req, res) => {
  const { userId, status, currentUserId } = req.body;

  const user = await User.findById(userId).lean();
  if (!user) return res.status(404).send("User not found");

  await User.archiveOrDeleteUser(userId, status);
  await AllTasks.clearTasks(userId);

  const allUserRooms = await Room.getUserRoomsById(userId);
  var changeMembers = new Promise((resolve) => {
    let i = 0;

    allUserRooms.forEach(async (room) => {
      const { type, _id: roomId } = room;
      if (type === "private") return;

      const updatedRoomData = await Room.addOrRemoveItemsInArrayById(
        roomId,
        "$pull",
        "members",
        userId
      );

      ioUpdateByRoomId(
        [roomId.toString()],
        "room",
        "membersChanged",
        updatedRoomData,
        currentUserId
      );

      i++;
      if (allUserRooms.length === i) resolve();
    });
  });
  Promise.all([changeMembers]);

  ioUpdateToAllUsers(
    "user",
    status === "archived" ? "userArchived" : "userTemporaryDeleted",
    userId,
    currentUserId
  );

  res.status(200).send(userId);
});

router.post("/activate_user", auth, async (req, res) => {
  const { userId, currentUserId } = req.body;

  const userData = await User.updateOneField(userId, "status", "active");

  userData.userRooms.forEach(async (roomId) => {
    const messageSum = await Room.getRoomMessageSumById(roomId);

    await User.addOrRemoveItemsInArrayById(
      userId,
      "$addToSet",
      "last_seen_messages",
      {
        roomId,
        lastSeenMessageSum: messageSum ? messageSum : 0,
      }
    );
  });

  var changeMembers = new Promise((resolve) => {
    let i = 0;

    userData.userRooms.forEach(async (room) => {
      const updatedRoomData = await Room.addOrRemoveItemsInArrayById(
        room,
        "$addToSet",
        "members",
        userId
      );

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

module.exports = router;
