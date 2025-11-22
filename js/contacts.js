// contacts.js
export function initContacts({ container, portalState }) {
  const btnFind = container.querySelector("#btnFindContacts");
  const resultsDiv = container.querySelector("#contactsResults");

  btnFind.addEventListener("click", async () => {
    const first = container.querySelector("#filter-first").value.trim();
    const last = container.querySelector("#filter-last").value.trim();
    const email = container.querySelector("#filter-email").value.trim();

    // Basic validation
    if (email) {
      if (email.length < 3) {
        alert("Email must be at least 3 characters.");
        return;
      }
    } else {
      if (!first || !last) {
        alert("Both first and last name required if no email.");
        return;
      }
    }

    resultsDiv.innerHTML = `<div class="card loader">Searching contacts...</div>`;

    try {
      // Build query string
      let query = `project=${encodeURIComponent(portalState.project || "gtr")}`;
      if (email) {
        query += `&email=${encodeURIComponent(email)}`;
      } else {
        query += `&first_name=${encodeURIComponent(first)}&last_name=${encodeURIComponent(last)}`;
      }

      // Call your Worker API
      const res = await fetch(
        `https://client-portal-api.dennis-e64.workers.dev/api/contacts?${query}`
      );

      if (!res.ok) {
        resultsDiv.innerHTML = `<div class="card">Error searching contacts</div>`;
        return;
      }

      const rows = await res.json();

      if (!Array.isArray(rows) || rows.length === 0) {
        resultsDiv.innerHTML = `<div class="card">No contacts found.</div>`;
        return;
      }

      // Render results
      resultsDiv.innerHTML = rows
        .map(
          (r) => `
          <div class="card">
            <div class="row">
              <strong>${r.first_name || ""} ${r.last_name || ""}</strong>
              <span class="spacer"></span>
              <span class="muted">${r.email || ""}</span>
            </div>
            <div class="row">
              <button onclick="openContact('${r.contact_id}')">Open</button>
            </div>
          </div>
        `
        )
        .join("");
    } catch (err) {
      console.error("Contacts fetch error:", err);
      resultsDiv.innerHTML = `<div class="card">❌ Failed to fetch contacts</div>`;
    }
  });
}

// Placeholder for opening a contact detail view
window.openContact = async function (contactId) {
  alert(`Open contact ${contactId} — hook this into a detail view later.`);
};
