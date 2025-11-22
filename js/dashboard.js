// dashboard.js
export function initDashboard({ container, portalState }) {
  const statContacts = container.querySelector("#statContacts");
  const statNotes = container.querySelector("#statNotes");
  const statTasks = container.querySelector("#statTasks");
  const chartDiv = container.querySelector("#dashboardChart");

  async function loadStats() {
    chartDiv.innerHTML = `<div class="card loader">Loading dashboard...</div>`;
    try {
      const res = await fetch(
        `https://client-portal-api.dennis-e64.workers.dev/api/dashboard?project=${portalState.project || "gtr"}`
      );
      if (!res.ok) {
        chartDiv.innerHTML = `<div class="card">Error loading dashboard</div>`;
        return;
      }
      const data = await res.json();

      // Update stat cards
      statContacts.textContent = data.contacts || 0;
      statNotes.textContent = data.notes || 0;
      statTasks.textContent = data.tasks || 0;

      // Render a simple bar chart (inline SVG)
      const maxVal = Math.max(data.contacts || 0, data.notes || 0, data.tasks || 0, 1);
      chartDiv.innerHTML = `
        <svg width="100%" height="120" viewBox="0 0 300 120">
          ${bar("Contacts", data.contacts || 0, maxVal, 0)}
          ${bar("Notes", data.notes || 0, maxVal, 100)}
          ${bar("Tasks", data.tasks || 0, maxVal, 200)}
        </svg>
      `;
    } catch (err) {
      console.error("Dashboard error:", err);
      chartDiv.innerHTML = `<div class="card">❌ Failed to fetch dashboard</div>`;
    }
  }

  function bar(label, value, max, x) {
    const height = (value / max) * 100;
    const y = 110 - height;
    return `
      <rect x="${x + 20}" y="${y}" width="60" height="${height}" fill="#4a90e2"></rect>
      <text x="${x + 50}" y="115" text-anchor="middle" font-size="12">${label}</text>
      <text x="${x + 50}" y="${y - 5}" text-anchor="middle" font-size="12">${value}</text>
    `;
  }

  // Initial load
  loadStats();
}
