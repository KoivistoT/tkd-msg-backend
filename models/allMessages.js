const mongoose = require("mongoose");
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
    throw error;
  }
};
allMessagesSchema.statics.findMessageById = async function (roomId, messageId) {
  try {
    const item = await AllMessages.aggregate([
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
    throw error;
  }
};

const AllMessages = mongoose.model("AllMessages", allMessagesSchema);

exports.allMessagesSchema = allMessagesSchema;
exports.AllMessages = AllMessages;
