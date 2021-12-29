const mongoose = require("mongoose");
const Joi = require("joi");
const config = require("config");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    // required: true,
    trim: true,
    unique: true,
  },
  name: { type: String },
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
  // contacts: [userId:s]
  password: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 1024,
  },
  isAdmin: Boolean,
  is_active: { type: Boolean, dafault: false },
  created_at: { type: Date, default: Date.now() },
  updated_at: { type: Date, default: Date.now() },
});

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
      name: this.name,
      email: this.email,
      isAdmin: this.isAdmin,
    },
    config.get("jwtPrivateKey")
  );
  return token;
};
const User = mongoose.model("User", userSchema);

// function validateUser(user) {
const schema = Joi.object({
  name: Joi.string().min(5).max(50).required(),
  email: Joi.string().min(5).max(255).required().email(),
  password: Joi.string().min(5).max(255).required(),
});

//   return userSchema.validate(user, schema);
// }

exports.userSchema = userSchema;
exports.User = User;
exports.schema = schema;
