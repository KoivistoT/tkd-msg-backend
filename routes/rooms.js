const express = require("express");
const { Room, schema } = require("../models/room");
const _ = require("lodash");
const auth = require("../middleware/auth");
const router = express.Router();
const { AllMessages } = require("../models/allMessages");
const addObjectIds = require("../utils/addObjectIds");
const { User } = require("../models/user");
const { ioUpdateToByRoomId, ioUpdateById } = require("../utils/WebSockets");
const sortArray = require("../utils/sortArray");

router.post("/create_private_room", auth, async (req, res) => {
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const roomType = "private";
  const { userId, otherUserId } = req.body;
  const sortedIdArray = await sortArray([userId, otherUserId]);

  let result = await Room.findOne({
    roomName: sortedIdArray[0] + sortedIdArray[1],
  }).lean();

  if (result) {
    return res
      .status(400)
      .send("Room with the same name is already registered.");
  }

  const members = userId === otherUserId ? [userId] : [userId, otherUserId];

  const room = await Room.create({
    roomName: sortedIdArray[0] + sortedIdArray[1],
    type: roomType,
    members: members,
    roomCreator: userId,
    status: "draft",
  });

  //tämä toistuu kolmesti tee static method
  const roomId = room._id.toString();
  members.forEach((userId) => {
    User.updateOne(
      { _id: userId },
      {
        $addToSet: {
          userRooms: roomId,
          last_seen_messages: {
            roomId,
            lastSeenMessageSum: 0,
          },
        },
      }
    )

      .lean()
      .exec();
  });

  await AllMessages.create({ _id: room._id });

  ioUpdateById(members, "roomAdded", room);

  res.status(200).send(room);
});

router.post("/change_room_name", auth, async (req, res) => {
  const { roomId, newRoomName } = req.body;

  const newRoomData = await Room.findOneAndUpdate(
    { _id: roomId },
    { roomName: newRoomName }
  ).lean();

  const newRoomObject = { roomId, newRoomName };

  ioUpdateToByRoomId([roomId], "roomNameChanged", newRoomObject);

  res.status(200).send(newRoomData);
});

router.post("/create_direct_room", auth, async (req, res) => {
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const roomType = "direct";
  const { userId: roomCreator, otherUsers } = req.body;
  const roomName = roomCreator + "-" + Date.now();

  let roomUsers;

  otherUsers.includes(roomCreator)
    ? (roomUsers = otherUsers)
    : (roomUsers = [...otherUsers, roomCreator]);

  const room = await Room.create({
    roomName,
    type: roomType,
    roomCreator,
    members: roomUsers,
  });

  await AllMessages.create({ _id: room._id });

  const roomId = room._id.toString();
  roomUsers.forEach((userId) => {
    User.updateOne(
      { _id: userId },
      {
        $addToSet: {
          userRooms: roomId,
          last_seen_messages: {
            roomId,
            lastSeenMessageSum: 0,
          },
        },
      }
    ).exec();
  });

  ioUpdateById(roomUsers, "roomAdded", room);

  res.status(200).send(room);
});

router.post("/create_channel", auth, async (req, res) => {
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const roomType = "channel";
  const { userId: roomCreator, roomName, description } = req.body;

  const result = await Room.findOne({ roomName }).lean();
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

  const roomId = room._id.toString();
  await User.findOneAndUpdate(
    { _id: roomCreator },
    {
      $addToSet: {
        userRooms: roomId,
        last_seen_messages: {
          roomId,
          lastSeenMessageSum: 0,
        },
      },
    }
  ).lean();

  ioUpdateById([roomCreator], "roomAdded", room);

  res.status(200).send(room);
});

router.post("/change_members", auth, async (req, res) => {
  // tähän validointi
  const { roomId, members: newMemberList } = req.body;

  let result = await Room.findOne({ _id: roomId }).lean();
  if (!result) return res.status(400).send("Can't find room");

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
        ).lean();

        await User.findByIdAndUpdate(
          { _id: userId },
          { $addToSet: { userRooms: roomId } }
        ).lean();
      })
    );

    await Promise.all(
      pullMembers.map(async (userId) => {
        await Room.findByIdAndUpdate(
          { _id: roomId },
          { $pull: { members: userId } }
        ).lean();

        await User.findByIdAndUpdate(
          { _id: userId },
          { $pull: { userRooms: roomId } }
        ).lean();
      })
    );

    const updatedRoomData = await Room.findById(roomId).lean();
    ioUpdateById(addToSetMembers, "roomAdded", updatedRoomData);
    ioUpdateById(pullMembers, "roomRemoved", updatedRoomData._id);
    ioUpdateById(sameMembers, "membersChanged", updatedRoomData);

    res.status(200).send(updatedRoomData);
  } catch (error) {
    console.log(error);
    res.status(400).send("something faild");
  }
});
router.post("/leave_room", auth, async (req, res) => {
  // tähän validointi
  const { roomId, userId } = req.body;

  let result = await Room.findById(roomId);
  if (!result) return res.status(400).send("Can't find room");

  const newMembersList = result.members.filter((user) => user !== userId);

  try {
    await Room.findByIdAndUpdate(
      { _id: roomId },
      { $pull: { members: userId } }
    ).lean();
    await User.findByIdAndUpdate(
      { _id: userId },
      { $pull: { userRooms: roomId, last_seen_messages: { roomId: roomId } } }
    ).lean();

    const updatedRoomData = await Room.findById(roomId).lean();

    const allUsers = await User.find({}).lean();
    const usersWithId = addObjectIds(allUsers);

    let sum = 0;
    updatedRoomData.members.forEach((userId) => {
      usersWithId[userId].status === "active" ? (sum += 1) : (sum = sum);
    });

    if (sum === 0) {
      Room.deleteOne({ _id: roomId }).exec();
      AllMessages.deleteOne({ _id: roomId }).lean().exec();
    }

    ioUpdateById([userId], "roomRemoved", updatedRoomData._id);
    ioUpdateById(newMembersList, "membersChanged", updatedRoomData);

    res.status(200).send(updatedRoomData);
  } catch (error) {
    console.log(error);
    res.status(400).send("something faild");
  }
});

router.get("/all_channels", async (req, res) => {
  const roomData = await Room.aggregate([{ $match: { type: "channel" } }]);

  if (roomData.length === 0) return res.status(404).send("Room not found");

  const dataWithIds = addObjectIds(roomData);

  res.status(200).send(dataWithIds);
});

router.get("/delete_room/:id", async (req, res) => {
  const roomId = req.params.id;

  const roomData = await Room.find({ _id: roomId })
    .select("members type")
    .lean();

  if (roomData.length === 0) return res.status(404).send("Room not found");
  const members = roomData[0].members;

  Room.deleteOne({ _id: roomId }).lean().exec();
  AllMessages.deleteOne({ _id: roomId }).lean().exec();

  members.forEach((userId) => {
    User.findOneAndUpdate(
      { _id: userId },
      {
        $pull: { userRooms: roomId, last_seen_messages: { roomId: roomId } },
      },
      { safe: true, multi: false }
    )
      // User.findByIdAndUpdate(
      //   // { _id: userId, "last_seen_messages.roomId": roomId },
      //   // { $pull: { userRooms: roomId } },
      //   // { $pull: { "last_seen_messages.roomId": roomId } }
      //   { _id: userId, "last_seen_messages.roomId": roomId },
      //   {
      //     $pull: { "last_seen_messages.$.roomId": roomId },

      //   }
      // )
      .lean()
      .exec();
  });

  ioUpdateToByRoomId([roomId], "roomRemoved", roomId);

  res.status(200).send(roomId);
});

router.get("/archive_room/:id", async (req, res) => {
  const roomId = req.params.id;

  const result = await Room.findById(roomId).lean();
  if (!result) return res.status(404).send("Room not found");

  const roomData = await Room.findOneAndUpdate(
    { _id: roomId },
    { status: "archived" },
    { new: true }
  ).lean();

  ioUpdateById(roomData.members, "roomArchived", roomId);

  res.status(200).send(roomId);
});

router.post("/activate_room", async (req, res) => {
  const { roomId, userId } = req.body;

  const result = await Room.findById(roomId).lean();
  if (!result) return res.status(404).send("Room not found");

  const roomData = await Room.findOneAndUpdate(
    { _id: roomId },
    { status: "active" },
    { new: true }
  ).lean();

  ioUpdateById([userId], "roomActivated", roomId);
  ioUpdateById(roomData.members, "roomAdded", roomData);

  res.status(200).send(roomId);
});

router.post("/activate_draft_room", async (req, res) => {
  const { roomId, userId } = req.body;

  const result = await Room.findById(roomId).lean();
  if (!result) return res.status(404).send("Room not found");

  const roomData = await Room.findOneAndUpdate(
    { _id: roomId },
    { status: "active" },
    { new: true }
  ).lean();

  ioUpdateById(roomData.members, "roomActivated", roomId);

  res.status(200).send(roomId);
});

router.get("/:id", async (req, res) => {
  const result = await Room.find({ _id: req.params.id }); //.select("-messages");
  if (!result) return res.status(404).send("Room not found");

  res.status(200).send(result[0]);
});

module.exports = router;
