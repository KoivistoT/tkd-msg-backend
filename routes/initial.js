const Joi = require("joi");
const bcrypt = require("bcrypt");
const _ = require("lodash");
const { User } = require("../models/user");
const mongoose = require("mongoose");
const express = require("express");
const auth = require("../middleware/auth");
const { Room } = require("../models/room");
const router = express.Router();
const arrayToObject = require("../utils/arrayToObject");

router.get("/:id", auth, async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) return res.status(404).send("User not found");

  const userRoomsData = [];

  await Promise.all(
    user.userRooms.map(async (roomId) => {
      const room = await Room.findById(roomId);

      if (room) {
        userRoomsData.push(room);
      }
    })
  );

  // const room = await Room.findById({_id:});

  const initialData = {
    user,
    rooms: arrayToObject(userRoomsData),
  };
  res.send(initialData);
});

module.exports = router;
