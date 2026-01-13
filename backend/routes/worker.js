const express = require("express");
const router = express.Router();
const Worker = require("../models/worker");

// ================= ADD ASHA WORKER =================
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

    // 🔑 GENERATE LOGIN CREDENTIALS
    const username = name.toLowerCase().split(" ")[0] + phone.slice(-4);
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
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// ================= GET ALL WORKERS =================
router.get("/all", async (req, res) => {
  try {
    const workers = await Worker.find();
    res.json(workers);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


// ================= TOGGLE WORKER STATUS =================
router.patch("/toggle/:id", async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);

    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    worker.status = worker.status === "Active" ? "Inactive" : "Active";
    await worker.save();

    res.json({
      message: `Worker ${worker.status}`,
      status: worker.status
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// ================= ASHA WORKER LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const worker = await Worker.findOne({ username, password });

    if (!worker) {
      return res.status(401).json({
        message: "Invalid Worker ID or Password"
      });
    }

    if (worker.status !== "Active") {
      return res.status(403).json({
        message: "Your account is inactive. Please contact admin."
      });
    }

    res.json({
      message: "Login successful",
      worker: {
        id: worker._id,
        name: worker.name,
        area: worker.area
      }
    });

  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
});


// ⚠️ MUST BE LAST LINE
module.exports = router;
