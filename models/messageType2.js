const Joi = require("joi");
const mongoose = require("mongoose");

const { userSchema } = require("./user");

const messageType2Schema = new mongoose.Schema({
  //   roomId: { type: String, required: true }, // tässä voisi käyttää roomSchemaa, mutta se ei toiminut mulla, kun jotenkin ristiin menee schemat
  user: userSchema,
  messageBody: {
    type: String,
  },
  messageStatus: { type: Boolean, default: false },
  is_deleted: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now() },
  updated_at: { type: Date, default: Date.now() },
});

const MessageType2 = mongoose.model("MessageType2", messageType2Schema);

// function validateMessage(message) {
//   const schema = {
//     message: Joi.string().min(1).required(),
//     date: Joi.date(),
//   };

//   return Joi.validate(message, schema);
// }

exports.messageSchema = messageType2Schema;
exports.MessageType2 = MessageType2;
// exports.validate = validateMessage;
