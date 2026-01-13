const mongoose = require("mongoose");

const AadhaarSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  city: {
    type: String,
    required: true
  },

  aadhaar: {
    type: String,
    required: true,
    unique: true
  },

  phone: {
    type: String,   // 🔥 STRING is VERY IMPORTANT
    required: true,
    unique: true
  }
});

module.exports = mongoose.model("Aadhaar", AadhaarSchema,"aadhaar_registry");
