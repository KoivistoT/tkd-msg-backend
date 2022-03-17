const Joi = require("joi");
const mongoose = require("mongoose");

const allTasksSchema = new mongoose.Schema({
  tasks: { type: Array, default: [] },
});

const AllTasks = mongoose.model("AllTasks", allTasksSchema);

exports.allTasksSchema = allTasksSchema;
exports.AllTasks = AllTasks;
