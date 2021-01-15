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
    expired: {
      type: String,
    },
    isWordFor: {
      type: Boolean,
      required: true,
    },
    publish: {
      type: Boolean,
      required: true,
    },
    notesEN: {
      type: String,
    },
    notesFIN: {
      type: String,
    },
    order: {
      type: String,
    },
  })
);

function validateVideo(video) {
  const schema = {
    title: Joi.string().min(5).max(50).required(),
    date: Joi.string().min(1).required(),
    expired: Joi.string().allow(null, ""),
    isWordFor: Joi.boolean().required(),
    publish: Joi.boolean().required(),
    notesEN: Joi.string().allow(null, ""),
    notesFIN: Joi.string().allow(null, ""),
    order: Joi.string().allow(null, ""),
  };

  return Joi.validate(video, schema);
}

exports.Video = Video;
exports.validate = validateVideo;
