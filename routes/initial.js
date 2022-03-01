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
const addObjectIds = require("../utils/addObjectIds");

// router.get("/:id", auth, async (req, res) => {
router.get("/:id", async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) return res.status(404).send("User not found");

  const userRoomsData = [];
  const userAllMessages = [];
  const userAllImages = {};

  //hae tämä erikseen
  //hae tämä erikseen
  const allUsers = await User.aggregate([
    {
      $match: {
        archived: false,
      },
    },
    {
      $project: {
        password: 0,
        last_seen_messages: 0,
        userRooms: 0,
        contacts: 0,
      },
    },
  ]);

  //hae tämä erikseen
  //hae tämä erikseen

  await Promise.all(
    user.userRooms.map(async (roomId) => {
      // var start = +new Date();
      const [room, allMessages, allImages] = await Promise.all([
        Room.findById(roomId).lean(),
        AllMessages.findById(roomId).lean(),
        // AllMessages.findById(roomId).slice("messages", 2).lean(),
        AllMessages.aggregate([
          {
            $match: {
              _id: new mongoose.Types.ObjectId(roomId),
            },
          },
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
            $project: {
              "messages.imageURLs": 1,
              _id: 0,
            },
          },

          // { $limit: 1 },
        ]),
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
        const messagesObject = {
          _id: allMessages._id,
          messages: addObjectIds(allMessages.messages),
        };
        userAllMessages.push(messagesObject);
      }
      if (allImages) {
        Object.assign(userAllImages, {
          [roomId]: allImages.map(
            (message) => Object.values(message)[0].imageURLs
          ),
        });
      }
    })
  );

  // const room = await Room.findById({_id:});

  const initialData = {
    user,
    allUsers: addObjectIds(allUsers),
    rooms: addObjectIds(userRoomsData),
    messages: addObjectIds(userAllMessages),
    allImages: userAllImages,
  };

  // console.log(initialData.messages["61e6b87218d455cf6ecdb913"].messages);
  res.send(initialData);
});

module.exports = router;
