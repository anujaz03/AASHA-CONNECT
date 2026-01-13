const express = require("express");
const router = express.Router();

// 🔹 MOCK AADHAAR DATA
const aadhaarDB = {
  "7666799449": {
    name: "Sunita Patil",
    city: "Pune",
    aadhaar: "XXXX-XXXX-1234"
  },
  "9811562735": {
    name: "Nidhi Pawar",
    city: "Pune",
    aadhaar: "XXXX-XXXX-5678"
  }
};

router.get("/fetch/:phone", (req, res) => {
  const phone = req.params.phone;

  if (!aadhaarDB[phone]) {
    return res.status(404).json({ message: "Aadhaar not found" });
  }

  res.json(aadhaarDB[phone]);
});

module.exports = router;
