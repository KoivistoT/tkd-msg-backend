const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { AllMessages } = require("../models/allMessages");
const { ioUpdateByRoomId } = require("../utils/WebSockets");

router.get("/room_images/:id", auth, async (req, res) => {
  const roomId = req.params.id;

  const imageURLs = await AllMessages.getImageURLsByRoomId(roomId);
  if (!imageURLs) return res.status(404).send("Could not get the images URLs.");

  res.status(200).send({ imageURLs, roomId });
});

router.post("/add_reaction/", auth, async (req, res) => {
  const { roomId, messageId, reaction, currentUserId } = req.body;

  const updatedMessage = await AllMessages.updateReactions(
    roomId,
    messageId,
    reaction,
    currentUserId
  );

  ioUpdateByRoomId(
    [roomId],
    "messageUpdated",
    "messageUpdated",
    updatedMessage,
    currentUserId
  );

  res.status(200).send(updatedMessage);
});

router.post("/get_one_message", auth, async (req, res) => {
  const { roomId, messageId } = req.body;

  const message = await AllMessages.findMessageById(roomId, messageId);
  if (!message) return res.status(404).send("Message not found");

  res.status(200).send(message);
});

router.post("/delete/", auth, async (req, res) => {
  const { messageId, roomId, currentUserId } = req.body;

  AllMessages.deleteMessageById(roomId, messageId);

  ioUpdateByRoomId(
    [roomId],
    "msg",
    "messageDeleted",
    {
      roomId,
      messageId,
    },
    currentUserId
  );

  res.status(200).send("newMessageData");
});

router.get("/:id", auth, async (req, res) => {
  const roomId = req.params.id;
  const roomMessages = await AllMessages.getRoomMessagesById(roomId);

  if (!roomMessages) return res.status(404).send("Messages not found");

  res.status(200).send(roomMessages);
});

module.exports = router;
