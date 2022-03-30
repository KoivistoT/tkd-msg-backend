const Joi = require("joi");
const mongoose = require("mongoose");

const { userSchema } = require("./user");

const MESSAGE_TYPES = {
  TYPE_TEXT: "text",
  TYPE_IMAGE: "image",
  TYPE_DOCUMENT: "document",
  TYPE_REPLY: "reply",
};

const readByRecipientSchema = new mongoose.Schema(
  {
    //voi olla myös ilman id:tä, eli laita id false, katso vielä miten laitetaan. Vie turhaa tilaa se
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

const messageSchema = new mongoose.Schema(
  {
    //   roomId: { type: String, required: true }, // tässä voisi käyttää roomSchemaa, mutta se ei toiminut mulla, kun jotenkin ristiin menee schemat
    postedByUser: { type: String },
    messageBody: {
      type: String,
    },
    roomId: { type: String },
    replyMessageId: { type: String },
    imageURLs: { type: Array },
    documentData: {
      documentDownloadURL: { type: String },
      documentDbName: { type: String },
    },
    messageStatus: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    type: {
      type: String,
      default: () => MESSAGE_TYPES.TYPE_TEXT,
    },
    readByRecipients: [readByRecipientSchema],
    // created_at: { type: Date, default: Date.now() },
    // updated_at: { type: Date, default: Date.now() },
  },
  {
    timestamps: true,
    collection: "messages",
  }
);

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
