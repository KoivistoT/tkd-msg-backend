const mongoose = require("mongoose");

const Joi = require("joi");

const roomSchema = new mongoose.Schema(
  {
    roomName: {
      type: String,

      trim: true,
    },
    roomCreator: { type: String },
    type: { type: String, required: true },
    status: { type: String, default: "active" },
    topic: { type: String },
    latestMessage: { type: Object },
    description: { type: String },
    members: { type: Array, default: [] },
    messageSum: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: "rooms",
  }
);

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

roomSchema.statics.addOrRemoveItemsInArrayById = async function (
  roomId,
  action,
  fieldName,
  value
) {
  try {
    const updatedData = await this.findOneAndUpdate(
      { _id: roomId },
      {
        [action]: {
          [fieldName]: value,
        },
      },
      { new: true }
    )
      .lean()
      .exec();
    return updatedData;
  } catch (error) {
    // throw "Could not update data."
  }
};

roomSchema.statics.getUserRoomsById = async function (userId) {
  try {
    const rooms = this.find({ members: { $all: [userId] } });

    return rooms;
  } catch (error) {
    // throw "Could not get the messages.";
  }
};
roomSchema.statics.getRoomMessageSumById = async function (roomId) {
  try {
    const roomData = await this.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(roomId) } },
      { $unwind: { path: "$_id" } },
      {
        $project: {
          messageSum: 1,
        },
      },
    ]);

    return roomData[0].messageSum;
  } catch (error) {
    // throw "Could not get the messages.";
  }
};

roomSchema.statics.addMember = function () {
  try {
    return "lkj";
  } catch (error) {
    throw error;
  }
};
const Room = mongoose.model("Room", roomSchema);
exports.roomSchema = roomSchema;
exports.Room = Room;
exports.schema = schema;
