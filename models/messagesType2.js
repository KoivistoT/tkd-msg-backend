const mongoose = require("mongoose");
// const { userSchema } = require("./user");
// const { messageSchema } = require("./message");

// const { messageType2Schema } = require("./messageType2");
//https://stackfame.com/mongodb-chat-schema-mongoose-chat-schema-chat-application
const messagesType2Schema = new mongoose.Schema({
  // _id: { type: String },
  messages: [],
});

const MessagesType2 = mongoose.model("MessagesType2", messagesType2Schema);

exports.roomSchema = messagesType2Schema;
exports.MessagesType2 = MessagesType2;
