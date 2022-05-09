const { AllTasks } = require("../models/allTasks");
const auth = require("../middleware/auth");
const express = require("express");
const router = express.Router();

router.get("/clear_tasks/:id", auth, async (req, res) => {
  const currentUserId = req.params.id;

  if (currentUserId === null) {
    return res.status(404).send("no userID");
  }

  await AllTasks.findOneAndUpdate(
    { _id: currentUserId },
    { tasks: [] },
    { new: true }
  )
    .lean()
    .exec();

  res.status(200).send("success");
});

router.post("/remove_older_tasks_items", auth, (req, res) => {
  const { currentUserId, taskId } = req.body;

  const query = { _id: currentUserId.toString() };
  AllTasks.updateMany(
    query,
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
