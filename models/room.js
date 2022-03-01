const mongoose = require("mongoose");
const { userSchema } = require("./user");
const { messageSchema } = require("./message");
const Joi = require("joi");

//https://stackfame.com/mongodb-chat-schema-mongoose-chat-schema-chat-application
const roomSchema = new mongoose.Schema(
  {
    roomName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    type: { type: String, required: true }, //private or group or...
    topic: { type: String },
    // members: [userSchema],
    members: { type: Array, default: [] },
    // messages: [messageSchema],
    messageSum: { type: Number }, //tarvitseeko tätä...
  },
  {
    timestamps: true,
    collection: "rooms",
  }
);

const Room = mongoose.model("Room", roomSchema);

const schema = Joi.object({
  type: Joi.string().min(1).max(50).required(),
  roomName: Joi.string().min(1).max(100).required(),
  userId: Joi.string(),
  otherUserId: Joi.string(),
  members: Joi.array(),
});

exports.roomSchema = roomSchema;
exports.Room = Room;
exports.schema = schema;
