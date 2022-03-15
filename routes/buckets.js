const mongoose = require("mongoose");
const express = require("express");

const { Room } = require("../models/room");
const { Message, messageSchema } = require("../models/message");
const { AllMessages, validate } = require("../models/allMessages");
const auth = require("../middleware/auth");
const addObjectIds = require("../utils/addObjectIds");
const { User } = require("../models/user");
const { ioUpdateById, ioUpdateToByRoomId } = require("../utils/WebSockets");
const { ChangeBucket } = require("../models/changeBucket");

const router = express.Router();

router.get("/get_change_bucket/:id", async (req, res) => {
  const currentUserId = req.params.id;

  if (currentUserId === null) return res.status(404).send("no userID");

  const result = await ChangeBucket.findById(currentUserId).lean();
  ChangeBucket.findOneAndUpdate(
    { _id: currentUserId },
    { changes: [] },
    { new: true }
  )
    .lean()
    .exec();

  res.status(200).send(result);
});

router.get("/clear_bucket/:id", async (req, res) => {
  const currentUserId = req.params.id;

  if (currentUserId === null) return res.status(404).send("no userID");

  await ChangeBucket.findOneAndUpdate(
    { _id: currentUserId },
    { changes: [] },
    { new: true }
  )
    .lean()
    .exec();

  res.status(200).send("success");
});

module.exports = router;