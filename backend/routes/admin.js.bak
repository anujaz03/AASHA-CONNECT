const express = require("express");
const router = express.Router();
const Admin = require("../models/admin");

/* REGISTER ADMIN */
router.post("/register", async (req, res) => {
  try {
    const { phone, name, city, aadhaar, password } = req.body;

    const existing = await Admin.findOne({ phone });
    if (existing) {
      return res.status(400).json({
        message: "Admin already registered"
      });
    }

   const bcrypt = require("bcryptjs");

const hashedPassword = await bcrypt.hash(password, 10);

const admin = new Admin({
  phone,
  password: hashedPassword,   // ✅ FIXED
  name,
  city,
  aadhaar
});

    await admin.save();

    res.json({ message: "Admin registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* LOGIN ADMIN */
router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    const admin = await Admin.findOne({ phone });

    if (!admin) {
      return res.status(404).json({
        message: "Admin not registered. Please register first."
      });
    }

    if (admin.password !== password) {
      return res.status(401).json({
        message: "Invalid password"
      });
    }

    res.json({
      message: "Login successful",
      admin: {
        name: admin.name,
        phone: admin.phone
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
