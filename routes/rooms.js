const express = require("express");
const router = express.Router();
const addObjectIds = require("../utils/addObjectIds");
const auth = require("../middleware/auth");
const removeItemFromArray = require("../utils/removeItemFromArray");
const sortArray = require("../utils/sortArray");
const { AllMessages } = require("../models/allMessages");
const { Room, schema } = require("../models/room");
const { ioUpdateByRoomId, ioUpdateByUserId } = require("../utils/WebSockets");
const { User } = require("../models/user");

router.post("/create_private_room", auth, async (req, res) => {
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { userId, otherUserId } = req.body;

  const sortedIdArray = await sortArray([userId, otherUserId]);
  const roomName = sortedIdArray[0] + sortedIdArray[1];

  let result = await Room.findOne({ roomName }).lean();

  if (result) {
    return res
      .status(400)
      .send("Room with the same name is already registered.");
  }

  const members = userId === otherUserId ? [userId] : [userId, otherUserId];
  const newRoom = await Room.createRoom(
    sortedIdArray[0] + sortedIdArray[1],
    "private",
    members,
    userId,
    "draft"
  );
  const roomId = newRoom._id.toString();

  User.addRoomToUsers(members, roomId);
  await AllMessages.create({ _id: newRoom._id });

  ioUpdateByUserId(members, "roomAdded", "roomAdded", newRoom);

  res.status(200).send(newRoom);
});

router.post("/change_room_name", auth, async (req, res) => {
  const { roomId, newRoomName } = req.body;

  const result = await Room.findById(roomId).lean();
  if (!result) return res.status(404).send("Room not found");

  const isNameFree = await Room.find({ roomName: newRoomName }).lean();

  if (isNameFree.length !== 0) {
    return res
      .status(400)
      .send("Channel with the same name is already registered.");
  }

  const data = await Room.updateOneField(roomId, "roomName", newRoomName);

  const newRoomObject = { roomId, newRoomName };

  ioUpdateByRoomId([roomId], "room", "roomNameChanged", newRoomObject);

  res.status(200).send(data);
});

router.post("/change_room_description", auth, async (req, res) => {
  const { roomId, description, currentUserId } = req.body;

  const result = await Room.findById(roomId).lean();
  if (!result) return res.status(404).send("Room not found");

  const data = await Room.updateOneField(roomId, "description", description);

  const newRoomObject = { roomId, description };

  ioUpdateByRoomId(
    [roomId],
    "room",
    "roomDescriptionChanged",
    newRoomObject,
    currentUserId
  );

  res.status(200).send(data);
});

router.post("/create_direct_room", auth, async (req, res) => {
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { userId: roomCreator, otherUsers } = req.body;

  const roomUsers = otherUsers.includes(roomCreator)
    ? otherUsers
    : [...otherUsers, roomCreator];

  const newRoom = await Room.createRoom(
    roomCreator + "-" + Date.now(),
    "direct",
    roomUsers,
    roomCreator,
    "active"
  );

  await AllMessages.create({ _id: newRoom._id });
  User.addRoomToUsers(roomUsers, newRoom._id.toString());

  ioUpdateByUserId(roomUsers, "roomAdded", "roomAdded", newRoom);

  res.status(200).send(newRoom);
});

router.post("/create_channel", auth, async (req, res) => {
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { userId: roomCreator, roomName, description } = req.body;

  const result = await Room.findOne({ roomName }).lean();
  if (result) {
    return res
      .status(400)
      .send("Channel with the same name is already registered.");
  }

  const newRoom = await Room.createRoom(
    roomName,
    "channel",
    [roomCreator],
    roomCreator,
    "active",
    description
  );

  await AllMessages.create({ _id: newRoom._id });

  User.addRoomToUsers([roomCreator], newRoom._id.toString());

  ioUpdateByUserId([roomCreator], "roomAdded", "roomAdded", newRoom);

  res.status(200).send(newRoom);
});

router.post("/change_members", auth, async (req, res) => {
  const { roomId, members: newMemberList, currentUserId } = req.body;

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
    ioUpdateByUserId(
      addToSetMembers,
      "roomAdded",
      "roomAdded",
      updatedRoomData
    );
    ioUpdateByUserId(
      pullMembers,
      "roomRemoved",
      "roomRemoved",
      updatedRoomData._id
    );

    ioUpdateByUserId(
      removeItemFromArray(currentUserId, sameMembers),
      "room",
      "membersChanged",
      updatedRoomData
    );

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

    ioUpdateByUserId(newMembersList, "room", "membersChanged", updatedRoomData);

    res.status(200).send(updatedRoomData);
  } catch (error) {
    console.log(error);
    res.status(400).send("something faild");
  }
});

router.post("/delete_room/", auth, async (req, res) => {
  const { roomId, currentUserId } = req.body;

  const roomData = await Room.findById(roomId).select("members type").lean();

  if (roomData.length === 0) return res.status(404).send("Room not found");

  const members = roomData.members;

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

      .lean()
      .exec();
  });

  ioUpdateByUserId(
    removeItemFromArray(currentUserId, members),
    "roomRemoved",
    "roomRemoved",
    roomId
  );

  res.status(200).send(roomId);
});

router.post("/activate_room", auth, async (req, res) => {
  const { roomId, userId } = req.body;

  const result = await Room.findById(roomId).lean();
  if (!result) return res.status(404).send("Room not found");

  const roomData = await Room.findOneAndUpdate(
    { _id: roomId },
    { status: "active" },
    { new: true }
  ).lean();

  ioUpdateByUserId([userId], "room", "roomActivated", roomId);
  ioUpdateByUserId(roomData.members, "roomAdded", "roomAdded", roomData);

  res.status(200).send(roomId);
});

router.post("/activate_draft_room", auth, async (req, res) => {
  const { roomId, userId } = req.body;

  const result = await Room.findById(roomId).lean();
  if (!result) return res.status(404).send("Room not found");

  const roomData = await Room.findOneAndUpdate(
    { _id: roomId },
    { status: "active" },
    { new: true }
  ).lean();

  ioUpdateByUserId(roomData.members, "room", "roomActivated", roomId);

  res.status(200).send(roomId);
});

module.exports = router;
