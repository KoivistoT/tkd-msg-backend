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
    readByUserId: String,
    readAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    timestamps: true,
  }
);

const messageSchema = new mongoose.Schema(
  {
    postedByUser: { type: String },
    messageBody: {
      type: String,
    },
    reactions: { type: Array },
    roomId: { type: String },
    replyMessageId: { type: String },
    imageURLs: { type: Array },
    documentData: {
      documentDownloadURL: { type: String },
      documentDisplayName: { type: String },
    },
    messageStatus: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    type: {
      type: String,
      default: () => MESSAGE_TYPES.TYPE_TEXT,
    },
    readByRecipients: [readByRecipientSchema],
  },
  {
    timestamps: true,
    collection: "messages",
  }
);

const Message = mongoose.model("Message", messageSchema);

exports.messageSchema = messageSchema;
exports.Message = Message;
