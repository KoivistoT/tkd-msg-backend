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
    // throw "Could not clear tasks.";
  }
};

allTasksSchema.statics.getUserTasksById = async function (currentUserId) {
  try {
    const data = await this.findById(currentUserId);

    const roomRemovedGroup = [];
    const roomAddedGroup = [];
    const msgGroup = [];
    const messageUpdated = [];
    const roomGroup = [];
    const userGroup = [];

    let taskGroups;

    if (data.tasks.length > 0) {
      data.tasks.forEach((task) => {
        const { taskGroupType } = task;
        if (taskGroupType === "roomAdded") {
          roomAddedGroup.push(task);
        }
        if (taskGroupType === "roomRemoved") {
          roomRemovedGroup.push(task);
        }
        if (taskGroupType === "msg") {
          msgGroup.push(task);
        }
        if (taskGroupType === "room") {
          roomGroup.push(task);
        }
        if (taskGroupType === "messageUpdated") {
          messageUpdated.push(task);
        }
        if (taskGroupType === "user") {
          userGroup.push(task);
        }
      });

      const latestTask = data.tasks.reduce((a, b) =>
        a.taskId > b.taskId ? a : b
      );
      const latestTaskId = latestTask.taskId;

      taskGroups = {
        latestTaskId,
        data: [
          { taskGroupType: "roomAdded", data: roomAddedGroup },
          { taskGroupType: "roomRemoved", data: roomRemovedGroup },
          { taskGroupType: "room", data: roomGroup },
          { taskGroupType: "user", data: userGroup },
          { taskGroupType: "msg", data: msgGroup },
          { taskGroupType: "messageUpdated", data: messageUpdated },
        ],
      };
    }

    return taskGroups;
  } catch (error) {
    // throw "Could not get tasks.";
  }
};

allTasksSchema.statics.updateTasks = async function (
  currentUserId,
  taskGroupType,
  taskType,
  data
) {
  try {
    const taskId = Date.now();

    const isAlreadyCurrentRoomLatestMessageChangedTask = await this.aggregate([
      {
        $match: {
          $and: [
            { _id: new mongoose.Types.ObjectId(currentUserId) },
            { "tasks.taskType": "roomLatestMessageChanged" },
            { "tasks.data.roomId": data.roomId },
          ],
        },
      },
      {
        $project: {
          tasks: {
            $filter: {
              input: "$tasks",
              as: "tasks",
              cond: {
                $and: [
                  {
                    $eq: ["$$tasks.data.roomId", data.roomId],
                    $eq: ["$$tasks.taskType", "roomLatestMessageChanged"],
                  },
                ],
              },
            },
          },
          _id: 0,
        },
      },
    ]);

    if (isAlreadyCurrentRoomLatestMessageChangedTask.length !== 0) {
      await this.findByIdAndUpdate(
        {
          _id: currentUserId,
        },
        {
          $pull: {
            tasks: {
              taskId:
                isAlreadyCurrentRoomLatestMessageChangedTask[0].tasks[0].taskId,
            },
          },
        },

        { new: true }
      )
        .lean()
        .exec();
    }

    await this.updateOne(
      { _id: currentUserId },
      { $addToSet: { tasks: { taskGroupType, taskType, data, taskId } } }
    ).exec();

    return true;
  } catch (error) {
    // throw "Could not update tasks.";
  }
};

const AllTasks = mongoose.model("AllTasks", allTasksSchema);

exports.allTasksSchema = allTasksSchema;
exports.AllTasks = AllTasks;
