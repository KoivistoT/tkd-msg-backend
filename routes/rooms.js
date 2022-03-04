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
const sortArray = require("../utils/sortArray");

router.post("/create_private_room", auth, async (req, res) => {
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const roomType = "private";
  const userId = req.body.userId;
  const otherUserID = req.body.otherUserId;
  const sortedIdArray = await sortArray([userId, otherUserID]);

  let roomCheck = await Room.findOne({
    roomName: sortedIdArray[0] + sortedIdArray[1],
  });

  if (roomCheck) {
    return res
      .status(400)
      .send("Room with the same name is already registered.");
  }

  const members = userId === otherUserID ? [userId] : [userId, otherUserID];

  const room = await Room.create({
    roomName: sortedIdArray[0] + sortedIdArray[1],
    type: roomType,
    members: members,
    roomCreator: userId,
  });

  members.forEach((userId) => {
    User.updateOne(
      { _id: userId },
      { $addToSet: { userRooms: room._id.toString() } }
    ).exec();
  });

  await AllMessages.create({ _id: room._id });

  ioUpdateById([userId, otherUserID], "roomAdded", room);

  res.status(200).send(room);
});

router.post("/create_direct_room", auth, async (req, res) => {
  console.log(req.res.req.user.id, "täällä on valmiiksi aina");
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const roomType = "direct";
  const roomCreator = req.body.userId;
  const otherUsers = req.body.otherUsers;
  const roomName = roomCreator + "-" + Date.now();

  let roomUsers;
  if (otherUsers.includes(roomCreator)) {
    roomUsers = otherUsers;
  } else {
    roomUsers = [...otherUsers, roomCreator];
  }

  const room = await Room.create({
    roomName,
    type: roomType,
    roomCreator,
    members: roomUsers,
  });
  // room = await room.save();

  await AllMessages.create({ _id: room._id });
  // messages = await messages.save();

  roomUsers.forEach((userId) => {
    User.updateOne(
      { _id: userId },
      { $addToSet: { userRooms: room._id.toString() } },
      async function (err, result) {
        if (err) console.log(err);
      }
    );
  });

  ioUpdateById(roomUsers, "roomAdded", room);

  res.status(200).send(room);
});

router.post("/create_channel", auth, async (req, res) => {
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const roomType = "channel";
  const roomCreator = req.body.userId;
  const roomName = req.body.roomName;
  const description = req.body.description;

  const result = await Room.findOne({ roomName });
  if (result)
    return res
      .status(400)
      .send("Channel with the same name is already registered.");

  const room = await Room.create({
    roomName,
    type: roomType,
    roomCreator,
    members: [roomCreator],
    description,
  });

  await AllMessages.create({ _id: room._id });

  await User.findOneAndUpdate(
    { _id: roomCreator },
    { $addToSet: { userRooms: room._id.toString() } }
  );

  ioUpdateById([roomCreator], "roomAdded", room);

  res.status(200).send(room);
});

router.post("/change_members", auth, async (req, res) => {
  // tähän validointi
  const roomId = req.body.roomId;
  const newMemberList = req.body.members;
  // console.log("alussa:", newMemberList.length);
  let result = await Room.findOne({ _id: roomId });
  if (!result) return res.status(400).send("Can't find room"); // tämä ei ehkä tarpeen, jos alussa validointi. toki aina parempi mitä enemmän varmuutta

  const membersBefore = result.members;

  if (membersBefore === newMemberList)
    return res.status(200).send("No changes needed");

  const sameMembers = newMemberList.filter((x) => membersBefore.includes(x));
  const addToSetMembers = newMemberList.filter(
    (x) => !membersBefore.includes(x)
  );
  const pullMembers = membersBefore.filter((x) => !newMemberList.includes(x));

  try {
    await Promise.all(
      addToSetMembers.map(async (userId) => {
        await Room.findByIdAndUpdate(
          { _id: roomId },
          { $addToSet: { members: userId } }
        );

        await User.findByIdAndUpdate(
          { _id: userId },
          { $addToSet: { userRooms: roomId } }
        );
      })
    );

    await Promise.all(
      pullMembers.map(async (userId) => {
        await Room.findByIdAndUpdate(
          { _id: roomId },
          { $pull: { members: userId } }
        );

        await User.findByIdAndUpdate(
          { _id: userId },
          { $pull: { userRooms: roomId } }
        );
      })
    );

    const updatedRoomData = await Room.findById(roomId).lean();
    // console.log(
    //   "lopussa:",
    //   updatedRoomData.members.length,
    //   "(" + newMemberList.length + ")"
    // );
    ioUpdateById(addToSetMembers, "roomAdded", updatedRoomData);
    ioUpdateById(pullMembers, "roomRemoved", updatedRoomData);
    ioUpdateById(sameMembers, "membersChanged", updatedRoomData);

    res.status(200).send(updatedRoomData);
    //tämä voisi olla jossain muualla functioissa., kuten muutkin, jottaon puhtaat nämä jutut täällä

    // const updatedRoomData = { _id: roomId, members: newMemberList };
  } catch (error) {
    console.log(error);
    res.status(400).send("something faild");
  }
});
router.post("/leave_room", auth, async (req, res) => {
  // tähän validointi
  const roomId = req.body.roomId;
  const userId = req.body.userId;
  // console.log("alussa:", newMemberList.length);
  let result = await Room.findById(roomId);
  if (!result) return res.status(400).send("Can't find room");

  // if (result.roomCreator === userId)
  //   return res.status(400).send("Can't leave room which you have created");

  const newMembersList = result.members.filter((user) => user !== userId);

  try {
    await Room.findByIdAndUpdate(
      { _id: roomId },
      { $pull: { members: userId } }
    );
    await User.findByIdAndUpdate(
      { _id: userId },
      { $pull: { userRooms: roomId } }
    );

    const updatedRoomData = await Room.findById(roomId).lean();

    const allUsers = await User.find({}).lean();
    const usersWithId = addObjectIds(allUsers);
    let sum = 0;
    updatedRoomData.members.forEach((userId) => {
      usersWithId[userId].status === "active" ? (sum += 1) : (sum = sum);
    });
    console.log(sum, "jäljellä aktiivisia");

    if (sum === 0) {
      //jos ei ketään jäljellä, deletoi huoneen
      Room.deleteOne({ _id: roomId }).exec();
      AllMessages.deleteOne({ _id: roomId }).exec();
    }

    const roomIdObject = { _id: roomId };

    ioUpdateById([userId], "roomRemoved", roomIdObject);
    ioUpdateById(newMembersList, "membersChanged", updatedRoomData);
    res.status(200).send(updatedRoomData);
    //tämä voisi olla jossain muualla functioissa., kuten muutkin, jottaon puhtaat nämä jutut täällä

    // const updatedRoomData = { _id: roomId, members: newMemberList };
  } catch (error) {
    console.log(error);
    res.status(400).send("something faild");
  }
});

router.get("/all_channels", async (req, res) => {
  const roomData = await Room.aggregate([
    {
      $match: { type: "channel" },
    },
  ]);

  if (roomData.length === 0) return res.status(404).send("Room not found");

  const dataWithIds = addObjectIds(roomData);

  res.status(200).send(dataWithIds);
});

router.get("/delete_room/:id", async (req, res) => {
  const roomId = req.params.id;

  const roomData = await Room.find({ _id: roomId }).select("members type");

  if (roomData.length === 0) return res.status(404).send("Room not found");
  const members = roomData[0].members;

  Room.deleteOne({ _id: roomId }).exec();
  AllMessages.deleteOne({ _id: roomId }).exec();

  members.forEach((userId) => {
    User.findByIdAndUpdate(
      { _id: userId },
      { $pull: { userRooms: roomId } }
    ).exec();
  });

  const roomIdObject = { _id: roomId };

  ioUpdateToByRoomId([roomId], "roomRemoved", roomIdObject);

  res.status(200).send(roomId);
});

router.get("/archive_room/:id", async (req, res) => {
  const roomId = req.params.id;

  const result = await Room.findById(roomId);
  if (!result) return res.status(404).send("Room not found");

  const roomData = await Room.findOneAndUpdate(
    { _id: roomId },
    { status: "archived" },
    { new: true }
  );

  const roomIdObject = { _id: roomId };

  ioUpdateById(roomData.members, "roomArchived", roomIdObject);

  res.status(200).send(roomId);
});

router.post("/activate_room", async (req, res) => {
  const roomId = req.body.roomId;
  const userId = req.body.userId;

  const result = await Room.findById(roomId);
  if (!result) return res.status(404).send("Room not found");

  const roomData = await Room.findOneAndUpdate(
    { _id: roomId },
    { status: "active" },
    { new: true }
  );

  const roomIdObject = { _id: roomId };

  ioUpdateById([userId], "roomActivated", roomIdObject);
  ioUpdateById(roomData.members, "roomAdded", roomData);

  res.status(200).send(roomId);
});

router.get("/:id", async (req, res) => {
  const result = await Room.find({ _id: req.params.id }); //.select("-messages");
  if (!result) return res.status(404).send("Room not found");

  // res.send(_.pick(result[0], ["_id"]));
  res.status(200).send(result[0]);
});

module.exports = router;
