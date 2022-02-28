const mongoose = require("mongoose");
const express = require("express");
const { Room, schema } = require("../models/room");
const _ = require("lodash");
const auth = require("../middleware/auth");
const router = express.Router();
const { message } = require("../models/message");
const { AllMessagesSchema, AllMessages } = require("../models/allMessages");
const addObjectIds = require("../utils/addObjectIds");
const { User } = require("../models/user");
const {
  ioUpdateToAllActiveUsers,
  ioUpdateToByRoomId,
  ioUpdateById,
} = require("../utils/WebSockets");

router.post("/create_room", auth, async (req, res) => {
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let roomCheck = await Room.findOne({ roomName: req.body.roomName });
  if (roomCheck)
    return res
      .status(400)
      .send("Room with the same name is already registered.");

  let room = await Room.create({
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

  let messages = await AllMessages.create({ _id: room._id });
  // AllMessages.updateOne(
  //   { _id: req.body.roomId },
  //   { $addToSet: { messages: firstMessage } },
  //   function (err, result) {}
  // );
  messages = await messages.save();

  res.status(200).send(room);
});

router.post("/change_membership", auth, async (req, res) => {
  // tähän validointi

  let roomCheck = await Room.findOne({ _id: req.body.roomId });
  if (!roomCheck) return res.status(400).send("Can't find room"); // tämä ei ehkä tarpeen, jos alussa validointi. toki aina parempi mitä enemmän varmuutta

  const dbAction = req.body.membership ? "$addToSet" : "$pull";

  try {
    const updatedRoomData = await Room.findByIdAndUpdate(
      { _id: req.body.roomId },
      {
        [dbAction]: {
          members: req.body.userId,
        },
      },
      { new: true }
    );

    //tämä voisi olla jossain muualla functioissa., kuten muutkin, jottaon puhtaat nämä jutut täällä
    User.updateOne(
      { _id: req.body.userId },
      {
        [dbAction]: {
          userRooms: req.body.roomId,
        },
      },
      async function (err, result) {
        if (err) console.log(err);
      }
    );
    const targetUsers = [req.body.userId];
    const action = req.body.membership ? "roomAdded" : "roomRemoved";

    //muutaa kyseisen käyttäjän huoneet, jotka näkyy
    ioUpdateById(targetUsers, action, updatedRoomData);
    //muuttaa kaikkien pääkäyttäjien controllin
    ioUpdateToAllActiveUsers("controlMembersChanged", updatedRoomData, true);
    //muuttaa kaikkien membersit, joilla on ks huone, paitsi target userin, joka on tuossa ekana
    ioUpdateToAllActiveUsers(
      "membersChanged",
      updatedRoomData,
      false,
      req.body.userId
    );
    // ioUpdateToByRoomId([req.body.roomId], "membersChanged", updatedRoomData);

    res.status(200).send(updatedRoomData);
  } catch (error) {
    console.log(error);
    res.status(400).send("something faild");
  }
});

router.get("/all", auth, async (req, res) => {
  // const room = await Room.find({}).select("-messages");
  // global.io.sockets.emit("chat message", "täältä");
  // global.io.sockets.to("12345").emit("chat message", { msg: "123441243" });
  const room = await Room.find({});
  if (!room) return res.status(404).send("Rooms not found");

  const roomsArray = addObjectIds(room);

  res.status(200).send(roomsArray);
});

router.get("/:id", async (req, res) => {
  const result = await Room.find({ _id: req.params.id }); //.select("-messages");
  if (!result) return res.status(404).send("Messages not found");

  // res.send(_.pick(result[0], ["_id"]));
  res.status(200).send(result[0]);
});

router.get("/members/:id", async (req, res) => {
  const result = await Room.find({ _id: req.params.id }).select("members");
  if (!result) return res.status(404).send("Members not found");

  // res.send(_.pick(result[0], ["_id"]));
  res.status(200).send(result[0]);
});

module.exports = router;
