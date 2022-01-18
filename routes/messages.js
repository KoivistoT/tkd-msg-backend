const mongoose = require("mongoose");
const express = require("express");

const { Room } = require("../models/room");
const { Message } = require("../models/message");
const { AllMessages, validate } = require("../models/allMessages");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/send_message", auth, async (req, res) => {
  //post_message on parempi nimi

  if (!req.body.roomId)
    return res
      .status(400)
      .send(
        "ei id:tä. Jos sitä ei laita, niin antaa laittaa silti jonkun idn tää. en tiedä miksi. Eiku update one joka tapauksessa updataa jonkun"
      );

  let message = new Message({
    messageBody: req.body.messageBody,
    roomId: req.body.roomId,
  });

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
    { $addToSet: { messages: message } },
    function (err, result) {}
  );

  //   message = await message.save();
  // console.log(message);
  // global.io.emit("chat message", {
  //   message,
  // });
  io.emit("chat message", {
    message: req.body.messageBody,
    roomId: req.body.roomId,
  });

  // console.log(taalla);
  res.status(200).json({ success: true, message }); //send(message);
});

router.post("/edit2", async (req, res) => {
  //post_message on parempi nimi

  const doc = await AllMessages.findById("61c07ea580c52533ef671f53");
  console.log(doc);
  console.log("pitää hakea sub documentin id:llä");
  //   message = await message.save();

  res.send(doc);
});

router.get("/:id", async (req, res) => {
  // console.log(req.params.id);
  const result = await AllMessages.find({ _id: req.params.id });
  // console.log(
  //   "olisi hyvä laittaa dataan, monta viestiä haluaa jne. eli ei id:llä?"
  // );
  if (!result) return res.status(404).send("Messages not found");

  res.status(200).send(result[0]);
});

module.exports = router;
