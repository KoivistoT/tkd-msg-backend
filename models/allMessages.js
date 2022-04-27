const mongoose = require("mongoose");
const addObjectIds = require("../utils/addObjectIds");
const { check } = require("../utils/check");

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
    timestamps: false,
  }
);

const messageSchema = new mongoose.Schema(
  {
    postedByUser: { type: String },
    messageBody: {
      type: String,
    },
    roomId: { type: String },
    reactions: { type: Array },
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
  },
  {
    timestamps: true,
    collection: "messages",
  }
);
const allMessagesSchema = new mongoose.Schema({
  messages: [messageSchema],
});

allMessagesSchema.statics.updateReactions = async function (
  roomId,
  messageId,
  reaction,
  currentUserId
) {
  try {
    const reactionObject = { reactionByUser: currentUserId, reaction };

    const item = await this.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(roomId) } },
      {
        $set: {
          message: {
            $filter: {
              input: "$messages",
              as: "m",
              cond: {
                $eq: ["$$m._id", new mongoose.Types.ObjectId(messageId)],
              },
            },
          },
        },
      },
      { $unwind: { path: "$message" } },

      {
        $project: { "message.reactions": 1, _id: 0 },
      },
    ]);

    let action = check.addOrPullReaction(
      item[0].message.reactions,
      reaction,
      currentUserId
    );

    await this.findOneAndUpdate(
      { _id: roomId },
      {
        [action]: {
          "messages.$[element].reactions": reactionObject,
        },
      },

      {
        arrayFilters: [
          {
            "element._id": messageId,
          },
        ],
      }
    ).exec();

    const updatedMessage = await this.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(roomId) } },
      {
        $set: {
          message: {
            $filter: {
              input: "$messages",
              as: "m",
              cond: {
                $eq: ["$$m._id", new mongoose.Types.ObjectId(messageId)],
              },
            },
          },
        },
      },
      { $unwind: { path: "$message" } },

      {
        $project: { message: 1, _id: 0 },
      },
    ]);
    return updatedMessage[0].message;
  } catch (error) {
    // throw "Could not update reactions";
  }
};

allMessagesSchema.statics.findMessageById = async function (roomId, messageId) {
  try {
    const item = await this.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(roomId) } },
      {
        $set: {
          message: {
            $filter: {
              input: "$messages",
              as: "m",
              cond: {
                $eq: ["$$m._id", new mongoose.Types.ObjectId(messageId)],
              },
            },
          },
        },
      },
      { $unwind: { path: "$message" } },

      {
        $project: { message: 1, _id: 0 },
      },
    ]);

    return item[0].message;
  } catch (error) {
    // throw "Could not get the message.";
  }
};

allMessagesSchema.statics.getImageURLsByRoomId = async function (roomId) {
  try {
    const imageURLs = await this.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(roomId) } },
      {
        $set: {
          messages: {
            $filter: {
              input: "$messages",
              as: "m",
              cond: { $eq: ["$$m.type", "image"] },
            },
          },
        },
      },
      { $unwind: { path: "$messages" } },
      { $unwind: { path: "$messages.imageURLs" } },
      { $project: { "messages.imageURLs": 1, _id: 0 } },
    ]);

    const reversedImageURLs = imageURLs
      .reverse()
      .map((message) => Object.values(message)[0].imageURLs);
    return reversedImageURLs;
  } catch (error) {
    // throw "Could not get the images URLs.";
  }
};

allMessagesSchema.statics.deleteMessageById = async function (
  roomId,
  messageId
) {
  try {
    AllMessages.updateOne(
      {
        _id: roomId,
        "messages._id": messageId,
      },
      { $set: { "messages.$.is_deleted": true } }
    ).exec();
    return true;
  } catch (error) {
    // throw "Could not delete the messge.";
  }
};

allMessagesSchema.statics.addNewMessage = async function (roomId, message) {
  try {
    AllMessages.updateOne(
      { _id: roomId },
      { $addToSet: { messages: message } }
    ).exec();
    return true;
  } catch (error) {
    // throw "Could not delete the messge.";
  }
};

allMessagesSchema.statics.getRoomMessagesById = async function (roomId) {
  try {
    const result = await this.findById(roomId).lean();

    const messagesObject = {
      _id: result._id,
      messages: addObjectIds(result.messages.reverse()),
    };
    return messagesObject;
  } catch (error) {
    // throw "Could not get the messages.";
  }
};

allMessagesSchema.statics.addReadByRecipients = async function (
  roomId,
  currentUserId
) {
  try {
    this.findOneAndUpdate(
      { _id: roomId },
      {
        $addToSet: {
          "messages.$[element].readByRecipients": {
            readByUserId: currentUserId,
          },
        },
      },

      {
        arrayFilters: [
          {
            "element.readByRecipients.readByUserId": { $ne: currentUserId },
            "element.postedByUser": { $ne: currentUserId },
          },
        ],
      }
    ).exec();
  } catch (error) {
    // throw "Could not get the messages.";
  }
};

const AllMessages = mongoose.model("AllMessages", allMessagesSchema);

exports.allMessagesSchema = allMessagesSchema;
exports.AllMessages = AllMessages;
