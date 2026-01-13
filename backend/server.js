const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

/* ===============================
   MIDDLEWARE (MUST COME FIRST)
================================ */
app.use(cors());
app.use(express.json());

/* ===============================
   ROUTES
================================ */
const adminRoutes = require("./routes/admin");
const aadhaarRoutes = require("./routes/aadhaar");
const familyRoutes = require("./routes/family");
const workerRoutes = require("./routes/worker");
app.use("/api/workers", workerRoutes);


app.use("/api/admin", adminRoutes);
app.use("/api/aadhaar", aadhaarRoutes);
app.use("/api/family", familyRoutes);

/* ===============================
   DATABASE + SERVER
================================ */
mongoose
  .connect("mongodb://127.0.0.1:27017/aasha")
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(5000, () =>
      console.log("🚀 Server running on port 5000")
    );
  })
  .catch((err) => console.error("❌ MongoDB error:", err));
