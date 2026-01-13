const mongoose = require("mongoose");

const WorkerSchema = new mongoose.Schema({
  name: String,
  phone: { type: String, unique: true },
  area: String,
  username:String,
  password:String,
  status: { type: String, default: "Active" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Worker", WorkerSchema);
