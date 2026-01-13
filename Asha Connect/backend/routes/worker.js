const express = require("express");
const router = express.Router();
const Worker = require("../models/worker");




// ADD WORKER
router.post("/add", async (req, res) => {
  try {
    const { name, phone, area } = req.body;

    if (!name || !phone || !area) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existing = await Worker.findOne({ phone });
    if (existing) {
      return res.status(400).json({ message: "Worker already exists" });
    }

    // 🔐 Generate credentials
    const username =
      name.split(" ")[0].toLowerCase() + phone.slice(-4);

    const password = Math.random().toString(36).slice(-8);

    const worker = new Worker({
      name,
      phone,
      area,
      username,
      password,
      status: "Active"
    });

    await worker.save();

    res.json({
      message: "ASHA Worker added successfully",
      credentials: {
        username,
        password
      }
    });

  } catch (err) {
    console.error("ADD WORKER ERROR:", err);
    res.status(500).json({ message: "Server error while adding worker" });
  }
});


// GET ALL WORKERS
router.get("/all", async (req, res) => {
  try {
    const workers = await Worker.find();
    res.json(workers);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch workers" });
  }
});

// TOGGLE STATUS
router.patch("/toggle/:id", async (req, res) => {
  const worker = await Worker.findById(req.params.id);
  worker.status = worker.status === "Active" ? "Inactive" : "Active";
  await worker.save();
  res.json({ message: "Status updated" });
});

module.exports = router;
