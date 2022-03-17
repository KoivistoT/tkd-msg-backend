const express = require("express");
const { User, validate, schema } = require("../models/user");
const bcrypt = require("bcrypt");
const router = express.Router();
const _ = require("lodash");
const addObjectIds = require("../utils/addObjectIds");
const mongoose = require("mongoose");
const {
  ioUpdateToAllUsers,
  ioUpdateToByRoomId,
} = require("../utils/WebSockets");
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
  ioUpdateToAllUsers("newUser", newUser);
  res
    .header("x-auth-token", token)
    .header("access-control-expose-headers", "x-auth-token")
    .send(_.pick(user, ["_id", "name", "email"]));
});

router.get("/all", auth, async (req, res) => {
  const users = await User.find({});
  if (!users) return res.status(404).send("Users not found");

  const usersObjects = addObjectIds(users);
  res.send(usersObjects);
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
      ioUpdateToByRoomId([room._id], "membersChanged", updatedRoomData);

      i++;
      if (targetRooms.length === i) resolve();
    });
  });
  Promise.all([changeMembers]);

  ioUpdateToAllUsers("userDeleted", currentUserId);

  res.send(currentUserId);
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

  ioUpdateToAllUsers("userDataEdited", newUserData);

  res.status(200).send(newUserData);
});
router.post("/save_last_seen_message_sum", auth, async (req, res) => {
  const { currentUserId, roomId, lastSeenMessageSum } = req.body;

  // const a = await User.f({}{ "last_seen_message.roomId": roomId }).exec();

  //pitäisi olla aina, onko hyvä silti varmistaa?
  const isAlreadyAdded = await User.aggregate([
    {
      $match: {
        $and: [
          { _id: new mongoose.Types.ObjectId(currentUserId) },
          { "last_seen_messages.roomId": roomId },
        ],
      },
    },
  ]);

  // let obj = isAlreadyAdded[0]?.last_seen_messages.find(
  //   (obj) => obj.roomId === roomId
  // );

  // //jos obj, on nähnyt jotain ennen, jos ei, ei ole nähnyt mitään ennen
  // const difference = obj
  //   ? lastSeenMessageSum - obj.lastSeenMessageSum
  //   : lastSeenMessageSum;
  // // console.log(difference);

  // if (difference <= 0) return;

  // const messageIds = await AllMessages.aggregate([
  //   { $match: { _id: new mongoose.Types.ObjectId(roomId) } },
  //   {
  //     $project: {
  //       messages: {
  //         $slice: ["$messages", -difference],
  //       },
  //     },
  //   },
  //   {
  //     $project: { "messages.postedByUser": 1, "messages._id": 1, _id: 0 },
  //   },
  //   // { $unwind: { path: "$message" } },
  // ]);

  // let updatedMessagesSum = 0;
  // var addReadByRecipients = new Promise((resolve) => {
  //   let i = 0;
  //   messageIds[0].messages.map(async (obj) => {
  //     if (obj.postedByUser === currentUserId) {
  //       i++;
  //       // console.log("oli oma viesti");
  //       if (messageIds.length === i) resolve();
  //       return;
  //     }
  //     // console.log("ei oma");
  //     const messageId = obj._id.toString();
  //     await AllMessages.findOneAndUpdate(
  //       {
  //         _id: roomId,
  //         "messages._id": messageId,
  //       },
  //       {
  //         $addToSet: {
  //           "messages.$.readByRecipients": { readByUserId: currentUserId },
  //         },
  //       },
  //       { new: true }
  //     ).exec();
  //     updatedMessagesSum++;
  //     i++;
  //     if (messageIds.length === i) resolve();
  //   });
  // });
  // await Promise.all([addReadByRecipients]);

  // if (updatedMessagesSum > 0) {
  //   // console.log("käy täällä");
  //   const updatedMessagesData = await AllMessages.aggregate([
  //     { $match: { _id: new mongoose.Types.ObjectId(roomId) } },
  //     {
  //       $project: {
  //         messages: {
  //           $slice: ["$messages", -difference],
  //         },
  //       },
  //     },
  //     {
  //       $project: { messages: 1, _id: 0 },
  //     },
  //   ]);

  //   ioUpdateToByRoomId(
  //     [roomId],
  //     "readByRecepientsAdded",
  //     updatedMessagesData[0].messages
  //   );
  // }

  // console.log("jatkuu kyllä");
  //täsä alkaa eri osio, jossa laitetaan lastseenmessagesum
  let newUserData;

  if (isAlreadyAdded.length > 0) {
    newUserData = await User.updateOne(
      { _id: currentUserId, "last_seen_messages.roomId": roomId },
      {
        $set: { "last_seen_messages.$.lastSeenMessageSum": lastSeenMessageSum },
      },
      { new: true }
    )
      .lean()
      .exec();
  } else {
    newUserData = await User.findOneAndUpdate(
      { _id: currentUserId },
      {
        $addToSet: {
          last_seen_messages: { roomId, lastSeenMessageSum },
        },
      },
      { new: true }
    )
      .lean()
      .exec();
  }

  // let allReadByData;
  // await Promise.all(
  //   readByMessagesIds.map(async (messageId) => {
  //***
  //***
  //***
  //mitä jos toisi tänne viimeisen viestin id:n,
  // sitten katsoo montako käyttäjä luki
  //ottaa id:n ja siitä edelliset tarvittavat viestit, jotka luki
  //laittaa ne luetuksi
  // console.log("tähän on hyvä saada varmistus, tee myöhemmin");
  // console.log("omia viestejä ei tarvitse merkata luetuksi.")
  //***
  //***
  //***

  // console.log(messageId);
  // const isAlreadyMarked = await AllMessages.aggregate([
  //   {
  //     $match: {
  //       _id: new mongoose.Types.ObjectId(roomId),
  //       $and: [
  //         { "messages._id": new mongoose.Types.ObjectId(messageId) },
  //         { "messages.readByRecipients.readByUserId": currentUserId },
  //       ],
  //     },
  //   },
  // ]);
  // console.log(isAlreadyMarked.length, "onko merkattu");
  // if (isAlreadyMarked.length === 0) {
  //     allReadByData = await AllMessages.findOneAndUpdate(
  //       {
  //         _id: roomId,
  //         "messages._id": messageId,
  //       },
  //       {
  //         $addToSet: {
  //           "messages.$.readByRecipients": { readByUserId: currentUserId },
  //         },
  //       },
  //       { new: true }
  //     ).exec();
  //     // }
  //   })
  // );

  // if (allReadByData) {
  //   const finalData = [];
  //   readByMessagesIds.forEach((messageId) => {
  //     const index = allReadByData.messages.findIndex(
  //       (item) => item._id.toString() === messageId
  //     );
  //     if (index === -1) return;
  //     finalData.push({
  //       messageId: allReadByData.messages[index]._id,
  //       readByRecipients: allReadByData.messages[index].readByRecipients,
  //       roomId: allReadByData.messages[index].roomId,
  //       postedByUser: allReadByData.messages[index].postedByUser,
  //     });
  //   });
  //   console.log(
  //     "toki jos readBy ja postedby on sama, niin ei kuulu lähettää!! "
  //   );
  //   const sendToUsers = finalData.map((item) => item.postedByUser);

  // }

  // console.log(finalData[0]);
  // const isAlreadyMarked = await Room.aggregate([
  //   {
  //     $match: {
  //       $and: [
  //         { _id: new mongoose.Types.ObjectId(roomId) },
  //         { "readByRecipients.readByUserId": currentUserId },
  //       ],
  //     },
  //   },
  // ]);

  // const a = await AllMessages.aggregate([
  //   {
  //     $match: {
  //       $and: [
  //         { _id: new mongoose.Types.ObjectId(roomId) },
  //         { "messages.readByRecipients.readByUserId": { $ne: currentUserId } },
  //       ],
  //     },
  //   },
  //   {
  //     $unwind: "$messages",
  //   },
  //   {
  //     $project: { "messages.readByRecipients": 1, "messages._id": 1 },
  //   },
  // ]);

  // console.log("täällä sähläytstä");
  // const a = await AllMessages.updateMany(
  //   {
  //     _id: roomId,
  //     "messages.$.readByRecipients.readByUserId": { $ne: currentUserId },
  //   },
  //   {
  //     $addToSet: {
  //       "messages.$.readByRecipients": { readByUserId: currentUserId },
  //     },
  //   },
  //   { multi: true }
  // );
  // const a = await AllMessages.updateMany(
  //   {
  //     _id: roomId,
  //     // "messages._id": "622f38dbf9c07b22b40ff0d7",
  //     // "messages.readByRecipients.readByUserId": { $ne: currentUserId },
  //     "messages.readByRecipients": { $size: 0 },

  //     // { $elemMatch: { readByUserId: { $ne: currentUserId } } },
  //     // { $size: 0 },

  //     //   $elemMatch: {
  //     //     $or: [{ readByUserId: { $ne: currentUserId }, $size: 0 }],
  //     //   },
  //   },
  //   //  "messages.readByRecipients": { $size: 0 },

  //   //päivitä teksti
  //   // { $set: { "messages.$.messageBody": "lfffffjlkj" } },
  //   //lisää arrayhin objecti
  //   {
  //     $addToSet: {
  //       "messages.$.readByRecipients": { readByUserId: currentUserId },
  //     },
  //   },
  //   {
  //     arrayFilters: [{ "messages.readByRecipients": { $size: 0 } }],
  //     multi: true,
  //   }
  // );
  // console.log(a);
  // console.log(isAlreadyMarked);
  res.status(200).send(newUserData);
});

router.post("/archive_or_delete_user", auth, async (req, res) => {
  const { userId, status } = req.body;

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

      ioUpdateToByRoomId(
        [room._id.toString()],
        "membersChanged",
        updatedRoomData
      );

      i++;
      if (targetRooms.length === i) resolve();
    });
  });
  Promise.all([changeMembers]);

  if (status === "archived") {
    ioUpdateToAllUsers("userArchived", userId);
  } else {
    ioUpdateToAllUsers("userTemporaryDeleted", userId);
  }
  res.send(userId);
});

router.get("/activate_user/:id", auth, async (req, res) => {
  const currentUserId = req.params.id;

  const userData = await User.findOneAndUpdate(
    { _id: currentUserId },
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
      { _id: currentUserId },
      {
        $addToSet: {
          last_seen_messages: {
            roomId,
            lastSeenMessageSum: roomData[0].messageSum,
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
        { $addToSet: { members: currentUserId } },
        { new: true }
      )
        .lean()
        .exec();

      ioUpdateToByRoomId([room.toString()], "membersChanged", updatedRoomData);
      i++;
      if (userData.userRooms.length === i) resolve();
    });
  });
  Promise.all([changeMembers]);

  await User.findById(
    currentUserId,
    "-password -last_seen_messages -contacts"
  ).lean();

  ioUpdateToAllUsers("userActivated", currentUserId);

  res.send(currentUserId);
});

router.get("/:id", auth, async (req, res) => {
  const user = await User.findById(req.params.id).lean();
  if (!user) return res.status(404).send("User not found");

  res.send(user);
});

module.exports = router;
