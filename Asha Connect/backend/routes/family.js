const express = require("express");
const router = express.Router();
const Family = require("../models/family");

// ADD FAMILY
router.post("/add", async (req, res) => {
  try {
    console.log("📥 FAMILY RECEIVED:", req.body);

    const family = new Family({
      headName: req.body.headName,
      address: req.body.address,
      contact: req.body.contact,
      notes: req.body.notes || "",
      addedByWorkerId: req.body.addedByWorkerId || "",
      addedByWorkerName: req.body.addedByWorkerName || ""
    });

    await family.save();

    res.json({ message: "Family saved successfully" });

  } catch (err) {
    console.error("❌ Family save error:", err);
    res.status(500).json({ message: "Failed to save family" });
  }
});

// GET ALL FAMILIES
router.get("/all", async (req, res) => {
  const families = await Family.find().sort({ createdAt: -1 });
  res.json(families);
});

module.exports = router;
