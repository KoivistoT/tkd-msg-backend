const Joi = require("joi");
const mongoose = require("mongoose");

const Notes = mongoose.model(
  "Notes",
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
  })
);

function validateNotes(note) {
  const schema = {
    titleEN: Joi.string().min(1).max(50).required(),
    titleFIN: Joi.string().min(1).max(50).required(),
    date: Joi.string().min(1).required(),
    type: Joi.string().required(),
    expired: Joi.string().allow(null, ""),
    publish: Joi.boolean().required(),
    textEN: Joi.string().allow(null, ""),
    textFIN: Joi.string().allow(null, ""),
  };

  return Joi.validate(note, schema);
}

exports.Notes = Notes;
exports.validate = validateNotes;
