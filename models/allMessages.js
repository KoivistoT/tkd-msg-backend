const mongoose = require("mongoose");
const { messageSchema } = require("./message");
// const { userSchema } = require("./user");
// const { messageSchema } = require("./message");

// const { messageType2Schema } = require("./messageType2");
//https://stackfame.com/mongodb-chat-schema-mongoose-chat-schema-chat-application
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
