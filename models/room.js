const mongoose = require("mongoose");
const { userSchema } = require("./user");
const { messageSchema } = require("./message");
const Joi = require("joi");

//https://stackfame.com/mongodb-chat-schema-mongoose-chat-schema-chat-application
const roomSchema = new mongoose.Schema(
  {
    roomName: {
      type: String,

      trim: true,
    },
    roomCreator: { type: String },
    type: { type: String, required: true }, //private or group or...
    status: { type: String, default: "active" },
    topic: { type: String },
    latestMessage: { type: Object },
    description: { type: String },
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
  type: Joi.string(),
  roomName: Joi.string(),
  userId: Joi.string(),
  otherUserId: Joi.string(),
  members: Joi.array(),
  status: Joi.string(),
  roomCreator: Joi.string(),
  lastMessage: Joi.object(),
  otherUsers: Joi.array(),
  description: Joi.string().allow("").allow(null),
  topic: Joi.string(),
});

exports.roomSchema = roomSchema;
exports.Room = Room;
exports.schema = schema;
