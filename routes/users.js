const addObjectIds = require("../utils/addObjectIds");
const { AllMessages } = require("../models/allMessages");
const { AllTasks } = require("../models/allTasks");
const auth = require("../middleware/auth");
const bcrypt = require("bcrypt");
const express = require("express");
const router = express.Router();
const { ioUpdateToAllUsers, ioUpdateByRoomId } = require("../utils/WebSockets");
const { Room } = require("../models/room");
const { User, schema } = require("../models/user");
const _ = require("lodash");

router.post("/create_user", auth, async (req, res) => {
  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  const userQuery = { email: req.body.email.toString() };
  let user = await User.findOne(userQuery);

  if (user) {
    return res.status(400).send("User already registered.");
  }

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

  const newUser = await User.findById(
    user._id,
    "-password -lastSeenMessages -contacts"
  ).lean();

  await AllTasks.create({ _id: newUser._id });
  ioUpdateToAllUsers("user", "newUser", newUser);

  res.send(_.pick(user, ["_id", "name", "email"]));
});

router.post("/edit_password", auth, async (req, res) => {
  const { email, password } = req.body;

  if (!password) {
    return res.status(400).send("Please add a password.");
  }

  const userQuery = { email: email.toString() };
  let user = await User.findOne(userQuery);

  if (!user) {
    return res.status(400).send("User not found.");
  }

  const salt = await bcrypt.genSalt(10);

  const newPassword = await bcrypt.hash(password, salt);

  const query = { email: email.toString() };
  const newUserData = await User.findOneAndUpdate(
    query,
    { password: newPassword },
    { new: true }
  ).lean();

  res.status(200).send(newUserData);
});

router.get("/all", auth, async (res) => {
  const users = await User.find({});

  if (!users) {
    return res.status(404).send("Users not found");
  }

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
  let { lastPresent } = await User.findById(userId);

  const userData = {
    userId: userId.toString(),
    lastPresent: lastPresent,
  };

  res.status(200).send(userData);
});

router.post("/save_last_seen_message_sum", auth, (req, res) => {
  const { currentUserId, roomId, lastSeenMessageSum } = req.body;

  AllMessages.addReadByRecipients(roomId, currentUserId);

  User.addReadByMessageSum(currentUserId, roomId, lastSeenMessageSum);

  setTimeout(() => {
    io.to(roomId).emit("subscribe_read_at", true);
  }, 2000);

  res.status(200).send(currentUserId);
});

router.post("/archive_or_delete_user", auth, async (req, res) => {
  const { userId, status, currentUserId } = req.body;

  const user = await User.findById(userId).lean();

  if (!user) {
    return res.status(404).send("User not found");
  }

  await User.archiveOrDeleteUser(userId, status);
  await AllTasks.clearTasks(userId);

  const allUserRooms = await Room.getUserRoomsById(userId);
  var changeMembers = new Promise((resolve) => {
    let i = 0;

    allUserRooms.forEach(async (room) => {
      const { type, _id: roomId } = room;

      if (type === "private") {
        return;
      }

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

  const returnUserID = userId.toString();
  res.status(200).send(returnUserID);
});

router.post("/activate_user", auth, async (req, res) => {
  const { userId, currentUserId } = req.body;

  const userData = await User.updateOneField(userId, "status", "active");

  userData.userRooms.forEach(async (roomId) => {
    const messageSum = await Room.getRoomMessageSumById(roomId);

    await User.addOrRemoveItemsInArrayById(
      userId,
      "$addToSet",
      "lastSeenMessages",
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

  await User.findById(userId, "-password -lastSeenMessages -contacts").lean();
  ioUpdateToAllUsers("user", "userActivated", userId, currentUserId);

  res.status(200).send(userId);
});

module.exports = router;
