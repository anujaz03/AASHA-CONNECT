const express = require("express");
const router = express.Router();

// Generate OTP Mock
router.post("/generate-otp", (req, res) => {
  const { method, value } = req.body;
  if (!value) {
    return res.status(400).json({ success: false, message: "Aadhaar or Mobile number is required." });
  }

  // Generate a random transaction ID
  const transactionId = "txn_" + Math.random().toString(36).substring(2, 11);

  // Return success, mock sending OTP (default OTP is "123456" for demo ease)
  res.json({
    success: true,
    message: `OTP sent successfully via ${method === "aadhaar" ? "Aadhaar-linked Mobile" : "Mobile"}.`,
    transactionId,
    mockOtp: "123456" // For debugging/demo
  });
});

// Verify OTP Mock
router.post("/verify-otp", (req, res) => {
  const { transactionId, otp, name } = req.body;
  if (!transactionId || !otp) {
    return res.status(400).json({ success: false, message: "Transaction ID and OTP are required." });
  }

  if (otp !== "123456") {
    return res.status(400).json({ success: false, message: "Invalid OTP. Please enter 123456." });
  }

  // Generate mock ABHA ID and Address
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const cleanName = name ? name.toLowerCase().replace(/[^a-z0-9]/g, "") : "user";
  const abhaAddress = `${cleanName}${randomSuffix}@abdm`;
  
  // Format ABHA ID: XX-XXXX-XXXX-XXXX
  const abhaId = `${Math.floor(10 + Math.random() * 89)}-${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(1000 + Math.random() * 8999)}`;

  res.json({
    success: true,
    message: "ABHA verified successfully.",
    abhaId,
    abhaAddress,
    profile: {
      name: name || "Verified Health User",
      abhaId,
      abhaAddress,
      gender: "Male",
      dob: "1995-08-15",
      status: "ACTIVE"
    }
  });
});

module.exports = router;
