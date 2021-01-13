const Joi = require("joi");
const mongoose = require("mongoose");
const { genreSchema } = require("./genre");

const Video = mongoose.model(
  "Videos",
  new mongoose.Schema({
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 255,
    },

    date: {
      type: String,
      required: true,
      min: 1,
      max: 255,
    },
  })
);

function validateVideo(video) {
  const schema = {
    title: Joi.string().min(5).max(50).required(),
    date: Joi.string().min(1).required(),
  };

  return Joi.validate(video, schema);
}

exports.Video = Video;
exports.validate = validateVideo;
