console.log("Reports JS loaded");

/* ================= LOAD REPORT DATA ================= */
async function loadReportData() {
  try {
    const res = await fetch("http://localhost:5000/api/family/all");
    const families = await res.json();

    if (!families || families.length === 0) {
      document.getElementById("aiSummary").innerText =
        "No family data available to generate report.";
      return;
    }

    // Store globally (used for CSV / charts)
    window._familiesCache = families;

    generateStats(families);
    generateSummary(families);

  } catch (err) {
    console.error("Report load failed", err);
    document.getElementById("aiSummary").innerText =
      "Failed to load report data.";
  }
}

/* ================= STAT NUMBERS ================= */
function generateStats(families) {
  document.getElementById("totalFamilies").innerText = families.length;

  const today = new Date().toDateString();
  const todayCount = families.filter(
    f => new Date(f.createdAt).toDateString() === today
  ).length;

  document.getElementById("todayFamilies").innerText = todayCount;
}
const currentMonth = new Date().getMonth();
const currentYear = new Date().getFullYear();

const families = window._familiesCache || [];

const monthCount = families.filter(f => {
  const d = new Date(f.createdAt);
  return d.getMonth() === currentMonth;
}).length;

document.getElementById("monthFamilies").innerText = monthCount;

document.getElementById("monthFamilies").innerText = monthCount;


/* ================= AI-LIKE SUMMARY (REAL DATA) ================= */
function generateSummary(families) {
  const workerCount = {};

  families.forEach(f => {
    const worker = f.addedByWorkerName || "Unknown";
    workerCount[worker] = (workerCount[worker] || 0) + 1;
  });

  let topWorker = "";
  let max = 0;

  for (let w in workerCount) {
    if (workerCount[w] > max) {
      max = workerCount[w];
      topWorker = w;
    }
  }

  document.getElementById("aiSummary").innerText =
    `📊 Report Summary:
Total families surveyed: ${families.length}.
Top performing ASHA worker: ${topWorker} (${max} families).
Data updated on ${new Date().toDateString()}.`;
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", loadReportData);
