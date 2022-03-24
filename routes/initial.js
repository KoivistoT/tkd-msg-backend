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

router.get("/", auth, async (req, res) => {
  // router.get("/:id", async (req, res) => {
  try {
    const userId = req.res.req.user._id;
    const user = await User.findById(userId);

    if (!user) return res.status(404).send("User not found");

    const userRoomsData = [];
    const userAllMessages = [];
    const userAllImages = {};

    //hae tämä erikseen
    //hae tämä erikseen
    const allUsers = await User.find({}).lean();
    //  await User.aggregate([
    //   { $match: { status: "active" } },
    //   {
    //     $project: {
    //       password: 0,
    //       last_seen_messages: 0,
    //       userRooms: 0,
    //       contacts: 0,
    //     },
    //   },
    // ]);

    //hae tämä erikseen
    //hae tämä erikseen

    await Promise.all(
      user.userRooms.map(async (roomId) => {
        // var start = +new Date();

        const [room, allMessages, allImages] = await Promise.all([
          // Room.findById(roomId).lean(),
          // Room.aggregate([
          //   {
          //     $match: {
          //       $and: [
          //         { _id: new mongoose.Types.ObjectId(roomId) },
          //         { status: "active" },
          //       ],
          //     },
          //   },
          // ]),

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
          // AllMessages.findById(roomId).lean(),
          AllMessages.findById(roomId).slice("messages", 2).lean(),
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

        if (room.length !== 0) {
          const roomObject = {
            _id: room[0]._id,
            ...room[0],
          };
          // console.log(roomObject);
          userRoomsData.push(roomObject);
        }

        // if (usersArchivedRooms.length !== 0) {
        //   const roomObject = {
        //     _id: usersArchivedRooms[0]._id,
        //     ...usersArchivedRooms[0],
        //   };
        //   // console.log(roomObject);
        //   userRoomsData.push(roomObject);
        // }

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

    // const room = await Room.findById({_id:});

    const initialData = {
      user,
      allUsers: addObjectIds(allUsers),
      rooms: addObjectIds(userRoomsData),
      messages: addObjectIds(userAllMessages),
      allImages: userAllImages,
    };

    // console.log(initialData.messages["61e6b87218d455cf6ecdb913"].messages);
    // setTimeout(() => {
    res.status(200).send(initialData);
    // }, 5000);
  } catch (error) {
    return res.status(400).send(error, "Tämä joo");
  }
});

module.exports = router;
