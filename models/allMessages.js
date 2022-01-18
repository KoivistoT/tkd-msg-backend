const mongoose = require("mongoose");
// const { userSchema } = require("./user");
// const { messageSchema } = require("./message");

// const { messageType2Schema } = require("./messageType2");
//https://stackfame.com/mongodb-chat-schema-mongoose-chat-schema-chat-application
const allMessagesSchema = new mongoose.Schema({
  // _id: { type: String },
  messages: { type: Array, default: [] },
});

const AllMessages = mongoose.model("AllMessages", allMessagesSchema);

exports.roomSchema = allMessagesSchema;
exports.AllMessages = AllMessages;
