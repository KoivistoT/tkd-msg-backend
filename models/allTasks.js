const Joi = require("joi");
const mongoose = require("mongoose");

const allTasksSchema = new mongoose.Schema({
  tasks: { type: Array, default: [] },
});

allTasksSchema.statics.clearTasks = async function (userId) {
  try {
    await this.findOneAndUpdate({ _id: userId }, { changes: [] }, { new: true })
      .lean()
      .exec();

    return true;
  } catch (error) {
    // throw "Could not get the messages.";
  }
};

const AllTasks = mongoose.model("AllTasks", allTasksSchema);

exports.allTasksSchema = allTasksSchema;
exports.AllTasks = AllTasks;
