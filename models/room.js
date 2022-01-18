const mongoose = require("mongoose");
const { userSchema } = require("./user");
const { messageSchema } = require("./message");

//https://stackfame.com/mongodb-chat-schema-mongoose-chat-schema-chat-application
const roomSchema = new mongoose.Schema(
  {
    roomName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    type: { type: String, required: true }, //private or...
    topic: { type: String },
    members: [userSchema],
    messages: [messageSchema],
    created_at: { type: Date, default: Date.now() },
    updated_at: { type: Date, default: Date.now() },
  },
  {
    timestamps: true,
    collection: "rooms",
  }
);

const Room = mongoose.model("Room", roomSchema);

exports.roomSchema = roomSchema;
exports.Room = Room;
