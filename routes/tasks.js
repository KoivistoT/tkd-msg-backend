const express = require("express");
const auth = require("../middleware/auth");

const { AllTasks } = require("../models/allTasks");

const router = express.Router();

router.get("/get_tasks/:id", auth, async (req, res) => {
  const currentUserId = req.params.id;

  if (currentUserId === null) return res.status(404).send("no userID");

  const result = await AllTasks.findById(currentUserId).lean();
  AllTasks.findOneAndUpdate(
    { _id: currentUserId },
    { tasks: [] },
    { new: true }
  )
    .lean()
    .exec();

  res.status(200).send(result);
});

router.get("/clear_tasks/:id", auth, async (req, res) => {
  const currentUserId = req.params.id;

  if (currentUserId === null) return res.status(404).send("no userID");

  await AllTasks.findOneAndUpdate(
    { _id: currentUserId },
    { tasks: [] },
    { new: true }
  )
    .lean()
    .exec();

  res.status(200).send("success");
});

router.post("/remove_task_item", auth, async (req, res) => {
  const { currentUserId, taskId } = req.body;
  // console.log(currentUserId, taskId, "tämä on joo");
  // const currentUserId = req.params.id;

  // if (currentUserId === null) return res.status(404).send("no userID");

  await AllTasks.findOneAndUpdate(
    { _id: currentUserId },

    { $pull: { tasks: { taskId: taskId } } },
    { new: true }
  )
    .lean()
    .exec();

  res.status(200).send("success");
});
router.post("/remove_older_tasks_items", auth, async (req, res) => {
  const { currentUserId, taskId } = req.body;

  AllTasks.updateMany(
    { _id: currentUserId },

    {
      $pull: {
        tasks: { taskId: { $lt: taskId + 1 } },
      },
    },
    { new: true }
  )
    .lean()
    .exec();

  res.status(200).send("success");
});

module.exports = router;
