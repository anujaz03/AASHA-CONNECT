const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Family = require("../models/family");

/* ================= HEALTH CHECK ================= */
router.get("/health", async (req, res) => {
  try {
    const mongoState = mongoose.connection.readyState;
    const states = ["Disconnected", "Connected", "Connecting", "Disconnecting"];
    res.json({
      success: true,
      backend: "Online",
      mongo: states[mongoState] || "Unknown"
    });
  } catch (e) {
    res.status(500).json({ success: false, backend: "Online", mongo: "Error: " + e.message });
  }
});

/* ================= SHARED HANDLERS ================= */
async function saveFamily(req, res) {
  try {
    console.log("Express API: POST saveFamily called with:", req.body);

    // Sync Conflict Detection
    const existing = await Family.findOne({ contact: req.body.contact });
    if (existing) {
      if (existing.headName === req.body.headName && existing.address === req.body.address) {
        console.log("Express API: Family already synced for contact:", req.body.contact);
        return res.json({
          success: true,
          message: "Family already synchronized",
          family: existing
        });
      } else {
        console.warn("Express API: Conflict detected for contact:", req.body.contact);
        return res.status(409).json({
          conflict: true,
          message: "Conflict detected: A family with this contact number already exists on the server.",
          serverFamily: existing,
          localFamily: req.body
        });
      }
    }

    let abhaId = req.body.abhaId || "";
    let abhaAddress = req.body.abhaAddress || "";

    if (abhaId === "PENDING_VERIFICATION") {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const cleanName = req.body.headName ? req.body.headName.toLowerCase().replace(/[^a-z0-9]/g, "") : "user";
      abhaAddress = `${cleanName}${randomSuffix}@abdm`;
      abhaId = `${Math.floor(10 + Math.random() * 89)}-${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(1000 + Math.random() * 8999)}`;
    }

    let latitude = req.body.latitude;
    let longitude = req.body.longitude;

    if (!latitude || !longitude || latitude === 0 || longitude === 0) {
      latitude = 18.5204 + (Math.random() - 0.5) * 0.08;
      longitude = 73.8567 + (Math.random() - 0.5) * 0.08;
    }

    const family = new Family({
      headName: req.body.headName,
      address: req.body.address,
      contact: req.body.contact,
      notes: req.body.notes || "",
      addedByWorkerId: req.body.addedByWorkerId || "",
      addedByWorkerName: req.body.addedByWorkerName || "",
      abhaId,
      abhaAddress,
      latitude,
      longitude,
      members: req.body.members || []
    });

    await family.save();
    console.log("Express API: MongoDB save success for contact:", req.body.contact);
    console.log(`Database Name: ${mongoose.connection.name}`);
    console.log(`Collection Name: ${family.collection.name}`);
    console.log(`Document ID: ${family._id}`);
    const docCount = await Family.countDocuments();
    console.log(`Document Count After Save: ${docCount}`);

    res.json({
      success: true,
      message: "Family saved successfully",
      family
    });

  } catch (err) {
    console.error("SAVE FAMILY ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to save family"
    });
  }
}

async function getFamilies(req, res) {
  try {
    const families = await Family.find().sort({ createdAt: -1 });
    res.json(families);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch families" });
  }
}

/* ================= ROUTES DECLARATIONS ================= */
router.post("/add", saveFamily);
router.post("/", saveFamily);
router.get("/all", getFamilies);
router.get("/", getFamilies);

/* ================= GET FAMILY BY ID OR CONTACT (GET /api/family/:id) ================= */
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    let query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { contact: id }] };
    } else {
      query = { contact: id };
    }
    const family = await Family.findOne(query);
    if (!family) {
      return res.status(404).json({ success: false, message: "Family not found" });
    }
    res.json(family);
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch family", error: err.message });
  }
});

/* ================= UPDATE FAMILY LEGACY (PUT /api/family/update/:contact) ================= */
router.put("/update/:contact", async (req, res) => {
  try {
    const contact = req.params.contact;
    const updatedFields = {
      headName: req.body.headName,
      address: req.body.address,
      notes: req.body.notes,
      abhaId: req.body.abhaId,
      abhaAddress: req.body.abhaAddress,
      members: req.body.members
    };
    if (req.body.latitude) updatedFields.latitude = req.body.latitude;
    if (req.body.longitude) updatedFields.longitude = req.body.longitude;

    const updated = await Family.findOneAndUpdate(
      { contact: contact },
      updatedFields,
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: "Family not found" });
    }
    res.json({ success: true, family: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: "Update failed", error: err.message });
  }
});

/* ================= UPDATE FAMILY BY ID OR CONTACT (PUT /api/family/:contact) ================= */
router.put("/:contact", async (req, res) => {
  // If contact is update, it will hit legacy first.
  try {
    const param = req.params.contact;
    let query = {};
    if (mongoose.Types.ObjectId.isValid(param)) {
      query = { $or: [{ _id: param }, { contact: param }] };
    } else {
      query = { contact: param };
    }

    const updatedFields = {
      headName: req.body.headName,
      address: req.body.address,
      notes: req.body.notes,
      abhaId: req.body.abhaId,
      abhaAddress: req.body.abhaAddress,
      members: req.body.members
    };
    if (req.body.latitude) updatedFields.latitude = req.body.latitude;
    if (req.body.longitude) updatedFields.longitude = req.body.longitude;

    const updated = await Family.findOneAndUpdate(
      query,
      updatedFields,
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: "Family not found" });
    }
    res.json({ success: true, family: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: "Update failed", error: err.message });
  }
});

/* ================= DELETE FAMILY BY ID OR CONTACT (DELETE /api/family/:id) ================= */
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    let query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { contact: id }] };
    } else {
      query = { contact: id };
    }
    const deleted = await Family.findOneAndDelete(query);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Family not found" });
    }
    res.json({ success: true, message: "Family deleted successfully", family: deleted });
  } catch (err) {
    res.status(500).json({ success: false, message: "Delete failed", error: err.message });
  }
});

module.exports = router;
