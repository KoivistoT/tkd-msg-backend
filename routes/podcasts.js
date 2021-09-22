const auth = require("../middleware/auth");
const express = require("express");
const router = express.Router();
const buzzsprout = require("../hooks/buzzsprout");

router.get("/", auth, async (req, res) => {
  try {
    buzzsprout.getAndSavePodcasts();
    buzzsprout.saveFetchTime();
    res.send(true);
  } catch (error) {
    res.send(false);
  }
});

router.get("/latest_fetch_time", auth, async (req, res) => {
  const time = await buzzsprout.getLastFetchTime();
  res.send(time);
});

module.exports = router;
