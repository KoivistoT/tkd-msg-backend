const Joi = require("joi");
const mongoose = require("mongoose");

const { userSchema } = require("./user");

const MESSAGE_TYPES = {
  TYPE_TEXT: "text",
};

const readByRecipientSchema = new mongoose.Schema(
  {
    _id: false,
    readByUserId: String,
    readAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    timestamps: false,
  }
);

const messageType2Schema = new mongoose.Schema(
  {
    //   roomId: { type: String, required: true }, // tässä voisi käyttää roomSchemaa, mutta se ei toiminut mulla, kun jotenkin ristiin menee schemat
    postedByUser: { type: String },
    messageBody: {
      type: String,
    },
    roomId: { type: String },
    messageStatus: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    type: {
      type: String,
      default: () => MESSAGE_TYPES.TYPE_TEXT,
    },
    // created_at: { type: Date, default: Date.now() },
    // updated_at: { type: Date, default: Date.now() },
  },
  {
    timestamps: true,
    collection: "messages",
  }
);

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
