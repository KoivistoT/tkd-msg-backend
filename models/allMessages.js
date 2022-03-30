const mongoose = require("mongoose");
// const { messageSchema } = require("./message");
// const { userSchema } = require("./user");
// const { messageSchema } = require("./message");

// const { messageType2Schema } = require("./messageType2");
//https://stackfame.com/mongodb-chat-schema-mongoose-chat-schema-chat-application
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
    messageStatus: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    documentData: {
      documentDownloadURL: { type: String },
      documentDisplayName: { type: String },
    },
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
const allMessagesSchema = new mongoose.Schema({
  // _id: { type: String },
  messages: [messageSchema],
});

allMessagesSchema.statics.findSomething = function (roomId, callback) {
  // return this.findOne(
  //   { _id: roomId, "messages.messageBody": "123123123123" },
  //   function (err, list) {
  //     console.log(list);
  //   }
  // );
  //https://masteringjs.io/tutorials/mongoose/aggregate
  // this.aggregate(
  //   [{ $match: "61e6a80eb30d002e91d67b5a" }],
  //   function (err, list) {
  //     console.log(list);
  //   }
  // );
};

const AllMessages = mongoose.model("AllMessages", allMessagesSchema);

exports.allMessagesSchema = allMessagesSchema;
exports.AllMessages = AllMessages;
