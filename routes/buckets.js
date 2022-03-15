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
  console.log(currentUserId);
  const result = await ChangeBucket.findById(currentUserId).lean();

  res.status(200).send(result);
});

module.exports = router;
