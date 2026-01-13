const express = require("express");
const router = express.Router();
const Admin = require("../models/admin");
const bcrypt = require("bcrypt");

router.post("/register", async (req, res) => {
  try {
    const { phone, name, city, aadhaar, password } = req.body;

    //  Check if admin already exists with same phone
    const existingAdmin = await Admin.findOne({ phone });
    if (existingAdmin) {
      return res.status(400).json({
        message: "Admin already registered with this phone number"
      });
    }

    //  Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new Admin({
      phone,
      name,
      city,
      aadhaar,
      password: hashedPassword
    });

    await admin.save();

    res.json({
      message: "Admin registered successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Registration failed"
    });
  }
});



router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    const admin = await Admin.findOne({ phone });

    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    if (admin.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    res.json({
      message: "Login successful",
      admin: {
        id: admin._id,
        name: admin.name,
        phone: admin.phone
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;



