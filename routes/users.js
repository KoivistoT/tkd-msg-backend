const mongoose = require("mongoose");
const express = require("express");
const { User, validate, schema } = require("../models/user");
const bcrypt = require("bcrypt");
const router = express.Router();
const _ = require("lodash");
const addObjectIds = require("../utils/addObjectIds");
const {
  ioUpdateById,
  ioUpdateToAllActiveUsers,
} = require("../utils/WebSockets");
const { roomSchema, Room } = require("../models/room");

router.post("/create_user", async (req, res) => {
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
      "userName",
      "displayName",
      "accountType",
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

router.get("/all", async (req, res) => {
  const users = await User.find({});
  if (!users) return res.status(404).send("Users not found");

  const usersObjects = addObjectIds(users);
  res.send(usersObjects);
});

router.get("/delete_user/:id", async (req, res) => {
  const userId = req.params.id;

  const result = await User.deleteOne({ _id: userId });

  if (result.deletedCount !== 1) return res.status(404).send("User not found");

  const targetRooms = await Room.find({ members: { $all: [userId] } });

  var changeMembers = new Promise((resolve) => {
    let i = 0;

    targetRooms.forEach(async (room) => {
      const updatedRoomData = await Room.findByIdAndUpdate(
        { _id: room._id },
        {
          $pull: {
            members: userId,
          },
        },
        { new: true }
      ).exec();
      ioUpdateToAllActiveUsers("membersChanged", updatedRoomData);
      i++;
      if (targetRooms.length === i) resolve();
    });
  });
  Promise.all([changeMembers]);

  ioUpdateToAllActiveUsers("userDeleted", { _id: userId });

  res.send(userId);
});

router.get("/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).send("User not found");

  res.send(user);
});

module.exports = router;
