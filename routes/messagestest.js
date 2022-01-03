// // const { Message, validate } = require("../models/message");
// const mongoose = require("mongoose");
// const express = require("express");
// const { MessageLists, messageSchema } = require("../models/messageLists");
// const { TestModel, testModel } = require("../models/testModel");
// const { MongoClient } = require("mongodb");
// const router = express.Router();

// const url =
//   "mongodb+srv://m001-student:m001-mongodb-basics@sandbox.1njxa.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
// const client = new MongoClient(url);

// client.connect();
// console.log("Connected successfully to server");

// router.post("/", async (req, res) => {
//   ////////*************
//   ////////*************
//   // let messageList = new MessageLists({
//   //   // roomId: "1234",
//   //   messages: [{ message: "eka viesti" }],
//   // });
//   // messageList = await messageList.save();
//   ////////*************
//   ////////*************
//   // MessageLists.updateOne(
//   //   { _id: "61b896fb630a89d8c2299086" },
//   //   { $push: { messages: { message: "jofwe2fo" } } },
//   //   function (err, result) {
//   //     if (err) {
//   //       res.send(err);
//   //     } else {
//   //       res.send(result);
//   //     }
//   //   }
//   // );
//   ////////*************
//   ////////*************

//   // const doc = await MessageLists.findOne({
//   //   messages: { $elemMatch: { text: "eka viesti" } },
//   // });

//   // const result = await MessageLists.find(
//   //   { _id: "61b896fa630a89d8c2299084" },
//   //   function (err, arr) {}
//   // );

//   // const result = await MessageLists.findOne({
//   //   messages: { $elemMatch: { message: "eka viesti" } },
//   // });
//   console.log(result);
//   // console.log(doc);
//   // MessageLists.findById("61b8900932db02bd79aab64a").exec((err, message) => {
//   //   console.log(message);
//   // });

//   // MessageLists.findById("61b85934ed8afecc9fb46195", function (err, result) {
//   //   if (!err) {
//   //     if (!result) {
//   //       res.status(404).send("User was not found");
//   //     } else {
//   //       // console.log(result);
//   //       result.messages.id("61b8594e5a0d5dd782f7a4f7").text =
//   //         "nythändddd ffse meni";

//   //       result.save(function (saveerr, saveresult) {
//   //         if (!saveerr) {
//   //           res.status(200).send(saveresult);
//   //         } else {
//   //           res.status(400).send(saveerr.message);
//   //         }
//   //       });
//   //     }
//   //   } else {
//   //     res.status(400).send(err.message);
//   //   }
//   // });

//   res.send("success");
// });

// router.get("/", async (req, res) => {
//   // const messages = await Message.find().sort("name");
//   // if (!messages) return res.status(404).send("Messages not found.");

//   // the following code examples can be pasted here...
//   // const cursor = db.collection("sample_airbnb").find({ _id: "1001265" });
//   const dbName = "sample_weatherdata";
//   const db = client.db(dbName);
//   const cursor = await db
//     .collection("data")
//     .find({ sections: { $all: ["UA1"] } })
//     // .find({ callLetters: "VC81" })
//     // .limit(10)
//     .toArray();
//   // console.log(cursor);

//   res.send(cursor.length.toString());
// });
// //https://stackoverflow.com/questions/48269827/mongoose-how-to-listen-for-collection-changes

// router.get("/addMsgListener", async (req, res) => {
//   listener();
// });

// const listener = () => {
//   const messageEventEmitter = MessageLists.watch();
//   messageEventEmitter.on("change", (change) => {
//     const returnObject = {
//       message: change.fullDocument.text,
//       id: change.fullDocument._id,
//     };
//     console.log(returnObject);
//     res.send(returnObject);
//   });
// };
// module.exports = router;
