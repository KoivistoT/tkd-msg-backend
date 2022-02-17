const Joi = require("joi");
const bcrypt = require("bcrypt");
const _ = require("lodash");
const { User } = require("../models/user");
const mongoose = require("mongoose");
const express = require("express");
const auth = require("../middleware/auth");
const { Room } = require("../models/room");
const { AllMessages, allMessagesSchema } = require("../models/allMessages");
const router = express.Router();
const arrayToObject = require("../utils/arrayToObject");

// router.get("/:id", auth, async (req, res) => {
router.get("/:id", async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) return res.status(404).send("User not found");

  const userRoomsData = [];
  const userAllMessages = [];

  await Promise.all(
    user.userRooms.map(async (roomId) => {
      // var start = +new Date();
      const [room, allMessages] = await Promise.all([
        Room.findById(roomId).lean(),
        AllMessages.findById(roomId).lean(),
        // AllMessages.findById(roomId).slice("messages", 2).lean(),
      ]);

      // var end = +new Date();
      // var diff = end - start;
      // console.log(diff);

      // AllMessages.findSomething(roomId, function (err, products) {
      //   // console.log(err);
      //   console.log(products, "tässä on nyt");
      // });

      // const a = await AllMessages.findById({ _id: roomId });
      // const b = await AllMessages.findById({ _id: roomId }).lean();
      // console.log(a);

      // console.log(a === b);
      // const allMessagesTest = await AllMessages.find({
      //   _id: roomId,
      // })
      //   // .select("-_id")
      //   .slice("messages", 2);
      // console.log(allMessagesTest);

      //https://mongoosejs.com/docs/queries.html
      // const AllMessagesTest2 = mongoose.model("AllMessages", allMessagesSchema);
      // katso jotain tuosta

      if (room) {
        userRoomsData.push(room);
      }
      if (allMessages) {
        userAllMessages.push(allMessages);
      }
    })
  );

  // const room = await Room.findById({_id:});

  const initialData = {
    user,
    rooms: arrayToObject(userRoomsData),
    messages: arrayToObject(userAllMessages),
  };
  // console.log(initialData.messages["61e6b87218d455cf6ecdb913"].messages);
  res.send(initialData);
});

module.exports = router;
