const Joi = require("joi");
const mongoose = require("mongoose");

const changeBucketSchema = new mongoose.Schema({
  changes: { type: Array, default: [] },
});

const ChangeBucket = mongoose.model("ChangeBucket", changeBucketSchema);

exports.changeBucketSchema = changeBucketSchema;
exports.ChangeBucket = ChangeBucket;
