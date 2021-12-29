const Joi = require("joi");
const mongoose = require("mongoose");
const { roomSchema } = require("./room");
const { userSchema } = require("./user");

const messageSchema = new mongoose.Schema({
  roomId: { type: String, required: true }, // tässä voisi käyttää roomSchemaa, mutta se ei toiminut mulla, kun jotenkin ristiin menee schemat
  user: userSchema,
  messageBody: {
    type: String,
  },
  messageStatus: { type: Boolean, default: false },
  is_deleted: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now() },
  updated_at: { type: Date, default: Date.now() },
});

const Message = mongoose.model("Message", messageSchema);

// function validateMessage(message) {
//   const schema = {
//     message: Joi.string().min(1).required(),
//     date: Joi.date(),
//   };

//   return Joi.validate(message, schema);
// }

exports.messageSchema = messageSchema;
exports.Message = Message;
// exports.validate = validateMessage;
