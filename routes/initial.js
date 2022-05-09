const addObjectIds = require("../utils/addObjectIds");
const { AllMessages } = require("../models/allMessages");
const auth = require("../middleware/auth");
const express = require("express");
const { User } = require("../models/user");
const router = express.Router();
const { Room } = require("../models/room");

const SEND_MESSAGES_FIRST_SUM = 15;

router.get("/", auth, async (req, res) => {
  try {
    const userId = req.res.req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send("User not found");
    }

    const userRoomsData = [];
    const userAllMessages = [];
    const userAllImages = {};
    const allUsers = await User.find({}).lean();

    await Promise.all(
      user.userRooms.map(async (roomId) => {
        const [room, allMessages, allImages] = await Promise.all([
          Room.getUseRoomsOnInit(roomId, userId),
          AllMessages.getAllMessagesOnInit(roomId, SEND_MESSAGES_FIRST_SUM),
          AllMessages.getAllImageURLsOnInit(roomId),
        ]);

        if (room.length !== 0) {
          const roomObject = {
            _id: room[0]._id,
            ...room[0],
          };
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
    return res.status(400).send(error, "code 2992771");
  }
});

router.post("/rest_messages/", auth, async (req, res) => {
  const { messagesNow } = req.body;
  const userAllMessages = await AllMessages.getRestMessagesOnInit(messagesNow);

  const messages = addObjectIds(userAllMessages);

  res.status(200).send(messages);
});

module.exports = router;
