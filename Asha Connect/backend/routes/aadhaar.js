const express = require("express");
const router = express.Router();
const Aadhaar = require("../models/aadhaar");

// 🔹 FETCH AADHAAR DATA FROM MONGODB
router.get("/:phone", async (req, res) => {
  try {
    const phone = req.params.phone;

    const record = await Aadhaar.findOne({ phone });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Aadhaar not found"
      });
    }

    res.json({
      success: true,
      data: record
    });

  } catch (err) {
    console.error("Aadhaar fetch error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

module.exports = router;
