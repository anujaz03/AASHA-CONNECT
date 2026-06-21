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

const handler = (req, res) => {
  const phone = req.params.phone;

  if (!aadhaarDB[phone]) {
    return res.status(404).json({ success: false, message: "Aadhaar not found" });
  }

  res.json({
    success: true,
    data: aadhaarDB[phone],
    ...aadhaarDB[phone]
  });
};

router.get("/fetch/:phone", handler);
router.get("/:phone", handler);

module.exports = router;
