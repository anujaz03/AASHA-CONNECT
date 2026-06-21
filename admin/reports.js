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
    generateChart(families);

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

  const currentMonth = new Date().getMonth();
  const monthCount = families.filter(f => {
    const d = new Date(f.createdAt);
    return d.getMonth() === currentMonth;
  }).length;

  document.getElementById("monthFamilies").innerText = monthCount;
}


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

/* ================= CHART GENERATOR ================= */
function generateChart(families) {
  const areaCounts = {};
  families.forEach(f => {
    const area = f.address || "Unknown";
    areaCounts[area] = (areaCounts[area] || 0) + 1;
  });

  const labels = Object.keys(areaCounts);
  const dataValues = Object.values(areaCounts);

  const ctx = document.getElementById('areaChart').getContext('2d');
  
  if (window._myAreaChart) {
    window._myAreaChart.destroy();
  }

  window._myAreaChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Families Surveyed',
        data: dataValues,
        backgroundColor: 'rgba(255, 45, 117, 0.7)',
        borderColor: 'rgba(255, 45, 117, 1)',
        borderWidth: 1,
        borderRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: 'white',
            stepSize: 1
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        x: {
          ticks: {
            color: 'white'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: 'white'
          }
        }
      }
    }
  });
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", loadReportData);
