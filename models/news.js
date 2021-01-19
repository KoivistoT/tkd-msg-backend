const Joi = require("joi");
const mongoose = require("mongoose");
const { genreSchema } = require("./genre");

const News = mongoose.model(
  "News",
  new mongoose.Schema({
    titleEN: {
      type: String,

      trim: true,
      minlength: 1,
      maxlength: 255,
    },
    titleFIN: {
      type: String,

      trim: true,
      minlength: 1,
      maxlength: 255,
    },
    date: {
      type: String,

      min: 1,
      max: 255,
    },
    imageSmall: {
      type: String,
      min: 1,
    },
    imageNormal: {
      type: String,
      min: 1,
    },
    expired: {
      type: String,
    },
    type: {
      type: String,
    },
    publish: {
      type: Boolean,
      required: true,
    },
    textEN: {
      type: String,
    },
    textFIN: {
      type: String,
    },
    order: {
      type: Number,
    },
  })
);

function validateNews(news) {
  const schema = {
    titleEN: Joi.string().min(1).max(50),
    titleFIN: Joi.string().min(1).max(50),
    date: Joi.string().min(1).required(),
    imageSmall: Joi.string().min(1).required(),
    imageNormal: Joi.string().min(1).required(),
    type: Joi.string().required(),
    expired: Joi.string().allow(null, ""),
    publish: Joi.boolean().required(),
    textEN: Joi.string().allow(null, ""),
    textFIN: Joi.string().allow(null, ""),
    order: Joi.number().allow(null, ""),
  };

  return Joi.validate(news, schema);
}

exports.News = News;
exports.validate = validateNews;
