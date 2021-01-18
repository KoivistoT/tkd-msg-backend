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
    type: {
      type: String,
    },
    isWordFor: {
      type: Boolean,
      required: true,
    },
    isFeature: {
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
      type: Number,
    },
  })
);

function validateVideo(video) {
  const schema = {
    title: Joi.string().min(5).max(50).required(),
    date: Joi.string().min(1).required(),
    type: Joi.string().required(),
    expired: Joi.string().allow(null, ""),
    isWordFor: Joi.boolean().required(),
    isFeature: Joi.boolean().required(),
    publish: Joi.boolean().required(),
    notesEN: Joi.string().allow(null, ""),
    notesFIN: Joi.string().allow(null, ""),
    order: Joi.number().allow(null, ""),
  };

  return Joi.validate(video, schema);
}

exports.Video = Video;
exports.validate = validateVideo;
