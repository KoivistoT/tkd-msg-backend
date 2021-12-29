const Joi = require("joi");
const mongoose = require("mongoose");
// const messageSchema = require("./message");

const testModel = new mongoose.Schema({});

const TestModel = mongoose.model("TestModel", testModel);

exports.testModel = testModel;
exports.TestModel = TestModel;
