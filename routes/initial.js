const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const addObjectIds = require("../utils/addObjectIds");
const { User } = require("../models/user");
const { Room } = require("../models/room");
const { AllMessages, allMessagesSchema } = require("../models/allMessages");

const SEND_MESSAGES_FIRST_SUM = 15;

router.get("/", auth, async (req, res) => {
  try {
    const userId = req.res.req.user._id;
    const user = await User.findById(userId);

    if (!user) return res.status(404).send("User not found");

    const userRoomsData = [];
    const userAllMessages = [];
    const userAllImages = {};

    const allUsers = await User.find({}).lean();

    await Promise.all(
      user.userRooms.map(async (roomId) => {
        const [room, allMessages, allImages] = await Promise.all([
          Room.aggregate([
            {
              $match: {
                _id: new mongoose.Types.ObjectId(roomId),

                $or: [
                  { $or: [{ status: "active" }, { status: "draft" }] },
                  { $and: [{ roomCreator: userId }, { status: "archived" }] },
                ],
              },
            },
          ]),
          AllMessages.findById(roomId)

            .slice("messages", -SEND_MESSAGES_FIRST_SUM)
            .lean(),
          AllMessages.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(roomId) } },
            {
              $set: {
                messages: {
                  $filter: {
                    input: "$messages",
                    as: "m",
                    cond: { $eq: ["$$m.type", "image"] },
                  },
                },
              },
            },
            { $unwind: { path: "$messages" } },
            { $unwind: { path: "$messages.imageURLs" } },
            {
              $project: { "messages.imageURLs": 1, _id: 0 },
            },
          ]),
        ]);

        if (room.length !== 0) {
          const roomObject = {
            _id: room[0]._id,
            ...room[0],
          };
          // console.log(roomObject);
          userRoomsData.push(roomObject);
        }

        if (allMessages) {
          const messagesObject = {
            _id: allMessages._id,
            messages: addObjectIds(allMessages.messages.reverse()),
          };
          userAllMessages.push(messagesObject);
        }
        if (allImages) {
          Object.assign(userAllImages, {
            [roomId]: allImages
              .reverse()
              .map((message) => Object.values(message)[0].imageURLs),
          });
        }
      })
    );

    const initialData = {
      user,
      allUsers: addObjectIds(allUsers),
      rooms: addObjectIds(userRoomsData),
      messages: addObjectIds(userAllMessages),
      allImages: userAllImages,
    };

    res.status(200).send(initialData);
  } catch (error) {
    return res.status(400).send(error, "Tämä joo");
  }
});
router.post("/rest_messages/", auth, async (req, res) => {
  try {
    const { currentUserId, messagesNow } = req.body;
    const userAllMessages = [];

    await Promise.all(
      Object.keys(messagesNow).map(async (currentRoomId) => {
        const result = await AllMessages.findById(currentRoomId).lean();

        if (
          Object.values(messagesNow[currentRoomId].messages)[
            Object.values(messagesNow[currentRoomId].messages).length - 1
          ]
        ) {
          const lastMessageIndex = result.messages.findIndex(
            (message) =>
              message._id.toString() ===
              Object.values(messagesNow[currentRoomId].messages)[
                Object.values(messagesNow[currentRoomId].messages).length - 1
              ]._id
          );

          if (lastMessageIndex === 0) return;
          const allMessages = await AllMessages.find(
            { _id: currentRoomId },
            { messages: { $slice: [0, lastMessageIndex] } }
          ).lean();

          if (allMessages[0].messages) {
            const messagesObject = {
              _id: allMessages[0]._id,
              messages: addObjectIds(allMessages[0].messages.reverse()),
            };
            userAllMessages.push(messagesObject);
          }
        }
      })
    );

    const messages = addObjectIds(userAllMessages);

    res.status(200).send(messages);
  } catch (error) {
    return res.status(400).send(error, "Tämä joo");
  }
});

module.exports = router;
