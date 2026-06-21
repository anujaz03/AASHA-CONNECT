require("dotenv").config();
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
const abdmRoutes = require("./routes/abdm");

app.use("/api/workers", workerRoutes);
app.use("/api/worker", workerRoutes); // Support singular prefix used in frontend

app.use("/api/admin", adminRoutes);
app.use("/api/aadhaar", aadhaarRoutes);
app.use("/api/family", familyRoutes);
app.use("/api/abdm", abdmRoutes);

/* ===============================
   DATABASE + SERVER
================================ */
const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/aasha";
const port = process.env.PORT || 5000;

mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(port, () =>
      console.log(`🚀 Server running on port ${port}`)
    );
  })
  .catch((err) => console.error("❌ MongoDB error:", err));

