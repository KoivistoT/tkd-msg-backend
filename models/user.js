const mongoose = require("mongoose");
const Joi = require("joi");
const config = require("config");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String },
    lastName: { type: String },
    displayName: { type: String },
    email: { type: String, lowercase: true, unique: true },
    last_seen_messages: { type: Array, default: [] },
    userRooms: { type: Array, default: [] },
    phone: { type: String, default: "" },
    last_present: { type: String },
    password: {
      type: String,
      required: true,
      minlength: 5,
      maxlength: 1024,
    },
    pushNotificationToken: { type: String },
    accountType: { type: String },
    status: { type: String, default: "active" },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
      name: this.name,
      email: this.email,
      isAdmin: this.isAdmin,
      accountType: this.accountType,
      pushNotificationToken: this.pushNotificationToken,
    },
    config.get("jwtPrivateKey")
  );
  return token;
};

const schema = Joi.object({
  firstName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().min(1).max(50).required(),
  displayName: Joi.string().min(1).max(50).required(),
  last_present: Joi.string(),
  accountType: Joi.string().min(1).max(50).required(),
  email: Joi.string().min(5).max(255).required().email(),
  phone: Joi.string(),
  password: Joi.string().min(5).max(255).required(),
  status: Joi.string(),
  pushNotificationToken: Joi.string(),
});

userSchema.statics.addRoomToUsers = function (roomUsers, roomId) {
  try {
    roomUsers.forEach((userId) => {
      this.updateOne(
        { _id: userId },
        {
          $addToSet: {
            userRooms: roomId,
            last_seen_messages: {
              roomId,
              lastSeenMessageSum: 0,
            },
          },
        }
      )
        .lean()
        .exec();
    });
  } catch (error) {
    // throw "Could not get room."
  }
};

userSchema.statics.updateUserDataById = async function (data) {
  try {
    const {
      accountType,
      firstName,
      lastName,
      displayName,
      email,
      phone,
      userId,
    } = data;

    const updatedData = await this.findOneAndUpdate(
      { _id: userId },
      { accountType, firstName, lastName, displayName, email, phone },
      { new: true }
    ).lean();

    return updatedData;
  } catch (error) {
    // throw "Could not update data."
  }
};
userSchema.statics.updateOneField = async function (
  currentUserId,
  fieldName,
  value
) {
  try {
    const updatedData = await User.findOneAndUpdate(
      { _id: currentUserId },
      { [fieldName]: value },
      { new: true }
    ).lean();

    return updatedData;
  } catch (error) {
    // throw "Could not update data."
  }
};

const User = mongoose.model("User", userSchema);
exports.userSchema = userSchema;
exports.User = User;
exports.schema = schema;
