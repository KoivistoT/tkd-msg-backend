const express = require("express");

const { ChangeBucket } = require("../models/changeBucket");

const router = express.Router();

router.get("/get_change_bucket/:id", async (req, res) => {
  const currentUserId = req.params.id;

  if (currentUserId === null) return res.status(404).send("no userID");

  const result = await ChangeBucket.findById(currentUserId).lean();
  ChangeBucket.findOneAndUpdate(
    { _id: currentUserId },
    { changes: [] },
    { new: true }
  )
    .lean()
    .exec();

  res.status(200).send(result);
});

router.get("/clear_bucket/:id", async (req, res) => {
  const currentUserId = req.params.id;

  if (currentUserId === null) return res.status(404).send("no userID");

  await ChangeBucket.findOneAndUpdate(
    { _id: currentUserId },
    { changes: [] },
    { new: true }
  )
    .lean()
    .exec();

  res.status(200).send("success");
});

router.post("/remove_bucket_item", async (req, res) => {
  const { currentUserId, bucketId } = req.body;
  // console.log(currentUserId, bucketId, "tämä on joo");
  // const currentUserId = req.params.id;

  // if (currentUserId === null) return res.status(404).send("no userID");

  await ChangeBucket.findOneAndUpdate(
    { _id: currentUserId },

    { $pull: { changes: { bucketId: bucketId } } },
    { new: true }
  )
    .lean()
    .exec();

  res.status(200).send("success");
});

module.exports = router;
