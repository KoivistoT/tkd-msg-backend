const mongoose = require("mongoose");
const express = require("express");
const { Room } = require("../models/room");
const _ = require("lodash");
const router = express.Router();
const { messageType2Schema } = require("../models/messageType2");
const {
  messagesType2Schema,
  MessagesType2,
} = require("../models/messagesType2");
router.post("/create_room", async (req, res) => {
  let room = new Room({ name: req.body.name });
  room = await room.save();

  res.send(room);
});

router.post("/create_room2", async (req, res) => {
  let room = new Room({
    name: req.body.name,
    // messagesType2Id: req.body.messagesType2Id,
  });
  console.log(
    "ei voi lisätä toista, koska lisää userSchema null, pitää aina kun luo huoneen olla ainakin se ketä lisää sen niin käyttäjissä, usereissa"
  );
  room = await room.save();

  // let firstMessage = new messageType2Schema({
  //   messageBody: "first message",
  //   roomId: room._id,
  // });

  let messages = new MessagesType2({ _id: room._id });
  // MessagesType2.updateOne(
  //   { _id: req.body.roomId },
  //   { $addToSet: { messages: firstMessage } },
  //   function (err, result) {}
  // );
  messages = await messages.save();

  res.send(room);
});

router.get("/all", async (req, res) => {
  // const room = await Room.find({}).select("-messages");
  const room = await Room.find({});
  if (!room) return res.status(404).send("Rooms not found");

  res.send(room);
});

router.get("/:id", async (req, res) => {
  const result = await Room.find({ _id: req.params.id }); //.select("-messages");
  if (!result) return res.status(404).send("Messages not found");

  // res.send(_.pick(result[0], ["_id"]));
  res.send(result[0]);
});

module.exports = router;
