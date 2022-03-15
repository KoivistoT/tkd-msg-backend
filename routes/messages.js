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

router.post("/send_message", auth, async (req, res) => {
  const {
    messageBody,
    roomId,
    userId: postedByUser,
    messageType: type,
    imageURLs,
    replyMessageId,
  } = req.body;

  if (!req.body.roomId)
    return res
      .status(400)
      .send(
        "ei id:tä. Jos sitä ei laita, niin antaa laittaa silti jonkun idn tää. en tiedä miksi. Eiku update one joka tapauksessa updataa jonkun"
      );

  // let message = new Message({
  //   messageBody: req.body.messageBody,
  //   roomId: req.body.roomId,
  // });

  // const message = await AllMessages.findOneAndUpdate(
  //   {
  //     roomId,
  //   },
  //   {
  // $addToSet: {
  //   messages: {
  //     messageBody,
  //     roomId,
  //     postedByUser,
  //     replyMessageId,
  //     type,
  //     imageURLs: imageURLs || null,
  //   },
  // },
  //   },
  //   { returnDocument: "after" }
  // ).exec();
  //******* */
  //******* */
  //******* */
  //******* */
  //TÄMÄ VOI TOIMIA NOPEAMMIN ,JOS TEKEE TIMESAMPIN ITSE, SE VOI TEHDÄ TÄSSÄ SEN JA SITTEN LÄHETTÄÄ JA SIT VASTA LISÄÄ VIESTEIHIN UPDATELLA
  // const newMessage = await AllMessages.findOneAndUpdate(
  //   { _id: roomId },

  //   {
  //     $addToSet: {
  //       messages: {
  //         messageBody, //: Math.random(),
  //         roomId,
  //         postedByUser,
  //         replyMessageId,
  //         type,
  //         imageURLs: imageURLs || null,
  //       },
  //     },
  //   },
  //   { returnDocument: "after" }
  // )
  //   .lean()
  //   .exec();

  // const message = newMessage.messages[newMessage.messages.length - 1];
  //******* */
  //******* */
  //******* */
  //******* */

  // return;
  const message = await Message.create({
    messageBody,
    roomId,
    postedByUser,
    replyMessageId,
    type,
    imageURLs: imageURLs || null,
  });

  // const messageWithId = { [message._id]: message };
  // console.log("täällä menee joo", roomId);
  // await ChangeBucket.create({ _id: "62209c1de54171139ed3dd20" });
  // ioUpdateToByRoomId
  // const messageObject = { _id: message._id.toString(), message };
  ioUpdateToByRoomId([roomId], "new message", message);
  // ioUpdateToByRoomId([roomId], "new message", message);

  const latestMessage = {
    createdAt: message.createdAt,
    messageBody: message.messageBody,
    postedByUser: message.postedByUser,
    roomId,
  };

  ioUpdateToByRoomId([roomId], "roomLatestMessageChanged", latestMessage); //tähänkin varmistus, eli tuon updaten alle

  Room.findOneAndUpdate(
    { _id: roomId },
    {
      latestMessage,
      $inc: { messageSum: 1 },
    },

    { new: true }
  )
    .lean()
    .exec();

  // io.to(roomId).emit("new message", {
  //   message: messageWithId,
  //   roomId,
  // });

  // console.log(
  //   "katso: https://www.codegrepper.com/code-examples/javascript/how+to+add+items+into+a+document+array+mongoose"
  // );
  // console.log(
  //   "updateOne päivittää jonkun, vaikka ei osuisi mikään filteristä. Eli täytyy olla tarkkana sen kanssa, ehkä käyttää jotain muuta"
  // );
  // console.log(
  //   "katso: https://www.codegrepper.com/code-examples/javascript/how+to+add+items+into+a+document+array+mongoose"
  // );
  //   const room = await Room.find({ _id: req.body.roomId });
  AllMessages.updateOne(
    { _id: req.body.roomId },
    { $addToSet: { messages: message } }
  ).exec();

  //   message = await message.save();
  // console.log(message);
  // global.io.emit("chat message", {
  //   message,
  // });

  res.status(200).json({ success: true, message: message }); //send(message);
});

router.get("/test2", auth, async (req, res) => {
  // const a = await User.find(
  //   {},
  //   "-password -last_seen_messages -userRooms -contacts"
  // ).lean();
  // console.log(a);
  // const a = await AllMessages.aggregate([
  //   {
  //     $match: {
  //       _id: new mongoose.Types.ObjectId("6214ebe20f8502580b0e19a1"),
  //     },
  //   },

  //   // {
  //   //   $set: {
  //   //     messages: {
  //   //       $filter: {
  //   //         input: "$messages",
  //   //         as: "m",
  //   //         cond: { $eq: ["$$m.type", "image"] },
  //   //       },
  //   //     },
  //   //   },
  //   // },

  //   { $unwind: { path: "$messages" } },
  //   // { $unwind: { path: "$messages.imageURLs" } },
  //   // {
  //   //   $project: {
  //   //     "messages.imageURLs": 1,
  //   //     _id: 0,
  //   //   },
  //   // },
  //   // { $sort: { "messages.createdAt": 1 } }, // -1 päin vastoin,
  //   { $skip: 2 },
  //   { $limit: 2 },
  // ]);
  // console.log(a);
  // console.log("tämä riittää, koska hakee vain yhden viestin");
  // AllMessages.findOne(
  //   { _id: "62123aa5890a7f6b6d1233e3" },
  //   {
  //     messages: {
  //       $elemMatch: {
  //         _id: "62123abc890a7f6b6d1233f4",
  //         // "readByRecipients._id": "62124ce1e807749f8165fb91", tämäkin ehto pätee
  //       },
  //     },
  //   },
  //   // {
  //   //   ["messages.$.readByRecipients"]: {
  //   //     $elemMatch: { _id: "62124ce1e807749f8165fb91" },
  //   //   },
  //   // },
  //   (err, result) => {
  //     if (err) {
  //       console.log(err);
  //     } else {
  //       console.log(result);
  //       // console.log(result.messages[0].readByRecipients);
  //     }
  //   }
  // );
  // .then((result, err) => {
  //   console.log(result, err);
  // });

  // console.log(
  //   "tee tämä sama, mutta vain niin, että saa tuloksen. Opettele tekemään tuloksia niin, että saat vain haetun jutun"
  // );
  // console.log("testaa findAndUpdateOne, tulee ihan eri tulos. Tutki niitä");
  // console.log(
  //   "onko exec sama kun se että laittaa tuon err result jutun loppuun, koska se vasta teki sen mitä piti"
  // );
  // AllMessages.updateOne(
  //   {
  //     _id: "62123aa5890a7f6b6d1233e3",
  //     messages: {
  //       $elemMatch: {
  //         _id: "62123abc890a7f6b6d1233f4",
  //         "readByRecipients._id": "62124ce1e807749f8165fb91",
  //       },
  //     },
  //   },
  //   {
  //     $set: {
  //       "messages.$[outer].readByRecipients.$[inner].readByUserId": "1",
  //     },
  //   },
  //   {
  //     arrayFilters: [
  //       { "outer._id": "62123abc890a7f6b6d1233f4" },
  //       { "inner._id": "62124ce1e807749f8165fb91" },
  //     ],
  //   },
  //   (err, result) => {
  //     if (err) {
  //       console.log(err);
  //     } else {
  //       console.log(result);
  //     }
  //   }
  // );
  // AllMessages.updateOne(
  //   {
  //     _id: "62123aa5890a7f6b6d1233e3",
  //     "messages._id": "62123abc890a7f6b6d1233f4",
  //   },
  //   //päivitä teksti
  //   // { $set: { "messages.$.messageBody": "lfffffjlkj" } },
  //   //lisää arrayhin objecti
  //   // { $addToSet: { "messages.$.readByRecipients": { readByUserId: "1234" } } },

  //   (err, result) => {
  //     if (err) {
  //       console.log(err);
  //     } else {
  //       console.log(result);
  //     }
  //   }
  // );

  res.status(200).send("joo"); //send(message);
});

router.get("/room_images/:id", async (req, res) => {
  const roomId = req.params.id;
  const roomImageURLs = await AllMessages.aggregate([
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
    { $project: { "messages.imageURLs": 1, _id: 0 } },

    // { $limit: 1 },
  ]);

  const imageURLs = roomImageURLs
    .reverse()
    .map((message) => Object.values(message)[0].imageURLs);

  res.send({ imageURLs, roomId });
});

router.post("/edit2", async (req, res) => {
  //post_message on parempi nimi

  const doc = await AllMessages.findById("61c07ea580c52533ef671f53");
  // console.log(doc);
  console.log("pitää hakea sub documentin id:llä");
  //   message = await message.save();

  res.send(doc);
});

router.post("/delete/", async (req, res) => {
  //post_message on parempi nimi
  console.log("tähän kaikki turva hommat, että jos ei löydy jne");
  const { messageId, roomId } = req.body;
  // console.log(messageId, roomId);

  const newMessageData = await AllMessages.updateOne(
    {
      _id: roomId,
      "messages._id": messageId,
    },
    //päivitä teksti
    { $set: { "messages.$.is_deleted": true } }

    //lisää arrayhin objecti
    // { $addToSet: { "messages.$.readByRecipients": { readByUserId: "1234" } } },

    // (err, result) => {
    //   if (err) {
    //     console.log(err);
    //   } else {
    //     ioUpdateToByRoomId([roomId], "messageDeleted", result);
    //   }
    // }
  ).exec();

  const messagesObject = {
    roomId,
    messageId,
  };
  ioUpdateToByRoomId([roomId], "messageDeleted", messagesObject);
  //
  // const doc = await AllMessages.findById("61c07ea580c52533ef671f53");
  // console.log(doc);
  // console.log("pitää hakea sub documentin id:llä");
  // //   message = await message.save();

  res.send("newMessageData");
});

router.get("/:id", async (req, res) => {
  // console.log(req.params.id);
  const roomId = req.params.id;

  const result = await AllMessages.findById(roomId).lean();

  // console.log(
  //   "olisi hyvä laittaa dataan, monta viestiä haluaa jne. eli ei id:llä?"
  // );
  if (!result) return res.status(404).send("Messages not found");

  const messagesObject = {
    _id: result._id,
    messages: addObjectIds(result.messages.reverse()),
  };

  // console.log(messagesObject);
  // const messages = { [roomId]: result };
  res.status(200).send(messagesObject);
});

module.exports = router;
