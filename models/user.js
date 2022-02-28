const mongoose = require("mongoose");
const Joi = require("joi");
const config = require("config");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    // userName: {
    //   type: String,
    //   // required: true,
    //   trim: true,
    //   unique: true,
    // },
    firstName: { type: String },
    lastName: { type: String },
    displayName: { type: String },
    logs: {
      last_login: { type: Date },
      last_activity: { type: Date },
      last_password_reset: { type: Date },
    },
    email: { type: String, lowercase: true, unique: true },
    state: {
      online: { type: Boolean, default: false },
      available: { type: Boolean, default: false },
    },
    last_seen_messages: { type: Array, default: [] },
    userRooms: { type: Array, default: [] },
    contacts: { type: Array, default: [] },
    password: {
      type: String,
      required: true,
      minlength: 5,
      maxlength: 1024,
    },
    pushNotificationToken: { type: String },
    accountType: { type: String },
    is_active: { type: Boolean, dafault: false },
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
    },
    config.get("jwtPrivateKey")
  );
  return token;
};
const User = mongoose.model("User", userSchema);

// function validateUser(user) {
const schema = Joi.object({
  firstName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().min(1).max(50).required(),
  displayName: Joi.string().min(1).max(50).required(),
  accountType: Joi.string().min(1).max(50).required(),
  email: Joi.string().min(5).max(255).required().email(),
  password: Joi.string().min(5).max(255).required(),
  userName: Joi.string().min(1).max(50).required(),
});

//   return userSchema.validate(user, schema);
// }

exports.userSchema = userSchema;
exports.User = User;
exports.schema = schema;
