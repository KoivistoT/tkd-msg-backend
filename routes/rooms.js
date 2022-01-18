const mongoose = require("mongoose");
const express = require("express");
const { Room, schema } = require("../models/room");
const _ = require("lodash");
const auth = require("../middleware/auth");
const router = express.Router();
const { message } = require("../models/message");
const { AllMessagesSchema, AllMessages } = require("../models/allMessages");

router.post("/create_room", auth, async (req, res) => {
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let roomCheck = await Room.findOne({ roomName: req.body.roomName });
  if (roomCheck)
    return res
      .status(400)
      .send("Room with the same name is already registered.");

  let room = new Room({
    roomName: req.body.roomName,
    type: req.body.type,
    // AllMessagesId: req.body.AllMessagesId,
  });
  console.log(
    "ei voi lisätä toista, koska lisää userSchema null, pitää aina kun luo huoneen olla ainakin se ketä lisää sen niin käyttäjissä, usereissa"
  );
  room = await room.save();

  // let firstMessage = new message({
  //   messageBody: "first message",
  //   roomId: room._id,
  // });

  let messages = new AllMessages({ _id: room._id });
  // AllMessages.updateOne(
  //   { _id: req.body.roomId },
  //   { $addToSet: { messages: firstMessage } },
  //   function (err, result) {}
  // );
  messages = await messages.save();

  res.send(room);
});

router.get("/all", auth, async (req, res) => {
  // const room = await Room.find({}).select("-messages");
  // global.io.sockets.emit("chat message", "täältä");
  // global.io.sockets.to("12345").emit("chat message", { msg: "123441243" });
  const room = await Room.find({});
  if (!room) return res.status(404).send("Rooms not found");
  // console.log(room);
  res.send(room);
});

router.get("/:id", async (req, res) => {
  const result = await Room.find({ _id: req.params.id }); //.select("-messages");
  if (!result) return res.status(404).send("Messages not found");

  // res.send(_.pick(result[0], ["_id"]));
  res.send(result[0]);
});

module.exports = router;
