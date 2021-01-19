const Joi = require("joi");
const mongoose = require("mongoose");
const { genreSchema } = require("./genre");

const Video = mongoose.model(
  "Videos",
  new mongoose.Schema({
    titleEN: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 255,
    },
    titleFIN: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 255,
    },
    date: {
      type: String,
      required: true,
      min: 1,
      max: 255,
    },
    shareEN: {
      type: String,
      min: 1,
    },
    shareFIN: {
      type: String,
      min: 1,
    },
    url: {
      type: String,
      min: 1,
    },
    thumbnailSmall: {
      type: String,
      min: 1,
    },
    thumbnailNormal: {
      type: String,
      min: 1,
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
    hideDate: {
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
    titleEN: Joi.string().min(1).max(50).required(),
    titleFIN: Joi.string().min(1).max(50).required(),
    date: Joi.string().min(1).required(),
    shareEN: Joi.string().min(1).required(),
    shareFIN: Joi.string().min(1).required(),
    url: Joi.string().min(1).required(),
    thumbnailSmall: Joi.string().min(1).required(),
    thumbnailNormal: Joi.string().min(1).required(),
    type: Joi.string().required(),
    expired: Joi.string().allow(null, ""),
    isWordFor: Joi.boolean(),
    isFeature: Joi.boolean(),
    hideDate: Joi.boolean(),
    publish: Joi.boolean().required(),
    notesEN: Joi.string().allow(null, ""),
    notesFIN: Joi.string().allow(null, ""),
    order: Joi.number().allow(null, ""),
  };

  return Joi.validate(video, schema);
}

exports.Video = Video;
exports.validate = validateVideo;
