document.addEventListener("DOMContentLoaded", async () => {
  // Fetch and update Workers count
  try {
    const base = window.API_BASE_URL || "https://aasha-connect.onrender.com";
    const resWorkers = await fetch(`${base}/api/worker/all`);
    const workers = await resWorkers.json();
    document.getElementById("totalWorkers").innerText = workers.length;
  } catch (err) {
    console.error("Dashboard workers stats error:", err);
  }

  // Fetch and update Families stats
  try {
    const base = window.API_BASE_URL || "https://aasha-connect.onrender.com";
    const res = await fetch(`${base}/api/family/all`);
    const families = await res.json();

    const totalFamilies = families.length;

    const today = new Date();
    const todayDate = today.toISOString().split("T")[0];

    let todayCount = 0;
    let monthCount = 0;

    families.forEach(f => {
      const created = new Date(f.createdAt);
      const createdDate = created.toISOString().split("T")[0];

      if (createdDate === todayDate) {
        todayCount++;
      }

      if (
        created.getMonth() === today.getMonth() &&
        created.getFullYear() === today.getFullYear()
      ) {
        monthCount++;
      }
    });

    document.getElementById("totalFamilies").innerText = totalFamilies;
    document.getElementById("todayFamilies").innerText = todayCount;
    document.getElementById("monthFamilies").innerText = monthCount;

    // --- LEAFLET GEOSPATIAL MAP INTEGRATION ---
    try {
      const map = L.map('outbreakMap').setView([18.5204, 73.8567], 12);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      const bounds = [];

      families.forEach(f => {
        if (f.latitude && f.longitude) {
          const lat = parseFloat(f.latitude);
          const lng = parseFloat(f.longitude);
          if (isNaN(lat) || isNaN(lng)) return;

          bounds.push([lat, lng]);

          // Check for pending vaccinations
          let pendingVaccines = [];
          if (f.members && Array.isArray(f.members)) {
            f.members.forEach(m => {
              if (m.vaccinations && Array.isArray(m.vaccinations)) {
                m.vaccinations.forEach(v => {
                  if (v.status === "Pending") {
                    pendingVaccines.push(`${m.name}: ${v.name}`);
                  }
                });
              }
            });
          }

          const hasCoverageGap = pendingVaccines.length > 0;
          const color = hasCoverageGap ? "#ff2d75" : "#2cd5c4";
          const fillColor = hasCoverageGap ? "#ff2d75" : "#2cd5c4";

          // Draw coverage gap / alert circle radius
          L.circle([lat, lng], {
            color: color,
            fillColor: fillColor,
            fillOpacity: 0.25,
            radius: hasCoverageGap ? 200 : 100
          }).addTo(map);

          // Add family marker with detailed status popup
          const marker = L.marker([lat, lng]).addTo(map);

          let popupContent = `
            <div style="color: #333; font-family: sans-serif; font-size: 12px; line-height: 1.4; min-width: 180px;">
              <strong style="font-size: 13px; color: #ff1675;">${f.headName}</strong><br>
              📍 <strong>Address:</strong> ${f.address}<br>
              📞 <strong>Contact:</strong> ${f.contact}<br>
              ${f.abhaId ? `🛡️ <strong>ABHA ID:</strong> ${f.abhaId}<br>` : ""}
              <hr style="margin: 6px 0; border: none; border-top: 1px solid #eee;">
          `;

          if (hasCoverageGap) {
            popupContent += `
              <span style="color: #ff2d75; font-weight: bold;">⚠️ Coverage Gaps (Pending):</span>
              <ul style="margin: 4px 0 0 14px; padding: 0;">
                ${pendingVaccines.map(v => `<li style="margin-bottom: 2px;">${v}</li>`).join('')}
              </ul>
            `;
          } else {
            popupContent += `<span style="color: #2cd5c4; font-weight: bold;">🟢 Immunizations Complete</span>`;
          }

          popupContent += `</div>`;
          marker.bindPopup(popupContent);
        }
      });

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [30, 30] });
      }
    } catch (mapErr) {
      console.error("Leaflet initialization error:", mapErr);
    }

  } catch (err) {
    console.error("Dashboard stats error:", err);
  }
});
