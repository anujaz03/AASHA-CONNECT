console.log("🔥🔥🔥 THIS SERVER.JS IS RUNNING 🔥🔥🔥");


const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/worker", require("./routes/worker"));



app.get("/", (req, res) => {
  res.send("AASHA backend running");
});

/* ROUTES */

app.use("/api/family", require("./routes/family"));
app.use("/api/aadhaar", require("./routes/aadhaar"));
app.use("/api/admin", require("./routes/admin"));

mongoose
  .connect("mongodb://127.0.0.1:27017/aasha")
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(5000, () =>
      console.log("🚀 Server running on port 5000")
    );
  })
  .catch((err) => console.error("❌ MongoDB error:", err));
