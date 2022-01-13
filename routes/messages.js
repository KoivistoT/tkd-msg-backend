const mongoose = require("mongoose");
const express = require("express");
const { Message } = require("../models/message");
const { Room } = require("../models/room");
const { MessageType2 } = require("../models/messageType2");
const { MessagesType2, validate } = require("../models/messagesType2");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/send_message", auth, async (req, res) => {
  //post_message on parempi nimi
  console.log(req.body);
  let message = new Message({
    messageBody: req.body.messageBody,
    roomId: req.body.roomId,
  });
  console.log(
    "katso: https://www.codegrepper.com/code-examples/javascript/how+to+add+items+into+a+document+array+mongoose"
  );
  //   const room = await Room.find({ _id: req.body.roomId });
  Room.updateOne(
    { _id: req.body.roomId },
    { $addToSet: { messages: message } },
    function (err, result) {}
  );
  //   message = await message.save();

  res.send(message);
});

router.post("/send_message2", auth, async (req, res) => {
  //post_message on parempi nimi

  if (!req.body.roomId)
    return res
      .status(400)
      .send(
        "ei id:tä. Jos sitä ei laita, niin antaa laittaa silti jonkun idn tää. en tiedä miksi. Eiku update one joka tapauksessa updataa jonkun"
      );

  let message = new MessageType2({
    messageBody: req.body.messageBody,
    roomId: req.body.roomId,
  });
  console.log(
    "updateOne päivittää jonkun, vaikka ei osuisi mikään filteristä. Eli täytyy olla tarkkana sen kanssa, ehkä käyttää jotain muuta"
  );
  console.log(
    "katso: https://www.codegrepper.com/code-examples/javascript/how+to+add+items+into+a+document+array+mongoose"
  );
  //   const room = await Room.find({ _id: req.body.roomId });
  MessagesType2.updateOne(
    { _id: req.body.roomId },
    { $addToSet: { messages: message } },
    function (err, result) {}
  );
  //   message = await message.save();
  console.log(message);
  res.send(message);
});

router.post("/edit2", async (req, res) => {
  //post_message on parempi nimi

  const doc = await MessagesType2.findById("61c07ea580c52533ef671f53");
  console.log(doc);
  console.log("pitää hakea sub documentin id:llä");
  //   message = await message.save();

  res.send(doc);
});

router.get("/:id", async (req, res) => {
  // console.log(req.params.id);
  const result = await MessagesType2.find({ _id: req.params.id });
  // console.log(
  //   "olisi hyvä laittaa dataan, monta viestiä haluaa jne. eli ei id:llä?"
  // );
  if (!result) return res.status(404).send("Messages not found");

  res.send(result[0]);
});

module.exports = router;
