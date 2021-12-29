const Joi = require("joi");
const mongoose = require("mongoose");
// const messageSchema = require("./message");
const messageSchema = new mongoose.Schema({ message: "string" });

const messageListsSchema = new mongoose.Schema({
  messages: [messageSchema],
});

const MessageLists = mongoose.model("MessageLists", messageListsSchema);

exports.messageListsSchema = messageListsSchema;
exports.messageSchema = messageSchema;
exports.MessageLists = MessageLists;
