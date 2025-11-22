// notes.js v1.0.3
export async function initNotes(portalState) {
  const container = document.getElementById("notesContent");
  const subtabs = document.querySelectorAll("#notes-subtabs button");

  subtabs.forEach(btn => {
    btn.addEventListener("click", () => {
      loadSubtab(btn.dataset.subtab, portalState);
    });
  });

  // Default view
  loadSubtab("history", portalState);
}

async function loadSubtab(subtab, portalState) {
  const container = document.getElementById("notesContent");
  container.innerHTML = `<p>Loading ${subtab}...</p>`;

  switch (subtab) {
    case "add":
      renderAddForm(container, portalState);
      break;
    case "history":
      await renderHistory(container, portalState);
      break;
    case "review":
      await renderReview(container, portalState);
      break;
    case "relationships":
      await renderRelationships(container, portalState);
      break;
    default:
      container.innerHTML = `<p>Unknown subtab</p>`;
  }
}

// --- Add Note ---
function renderAddForm(container, portalState) {
  container.innerHTML = `
    <h4>Add Note</h4>
    <textarea id="noteContent" placeholder="Enter note text..."></textarea>
    <button id="btnSaveNote" class="primary">Save</button>
    <div id="noteAddResult"></div>
  `;

  document.getElementById("btnSaveNote").addEventListener("click", async () => {
    const content = document.getElementById("noteContent").value;
    if (!content) return;

    try {
      const res = await fetch("https://client-portal-api.dennis-e64.workers.dev/api/add_note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project: portalState.project,
          contact_id: portalState.contactId || "demo-contact",
          content
        })
      });
      const data = await res.json();
      document.getElementById("noteAddResult").textContent =
        data.success ? "Note saved!" : `Error: ${data.error}`;
    } catch (err) {
      document.getElementById("noteAddResult").textContent = `Error: ${err.message}`;
    }
  });
}

// --- Notes History ---
async function renderHistory(container, portalState) {
  try {
    const res = await fetch(
      `https://client-portal-api.dennis-e64.workers.dev/api/notes?project=${portalState.project}&contact_id=${portalState.contactId || ""}`
    );
    const data = await res.json();

    if (!data.success) {
      container.innerHTML = `<p>No notes found.</p>`;
      return;
    }

    container.innerHTML = "<h4>Notes History</h4>";
    const list = document.createElement("ul");
    data.notes.forEach(n => {
      const li = document.createElement("li");
      li.textContent = `${n.created_at}: ${n.note_text}`;
      list.appendChild(li);
    });
    container.appendChild(list);
  } catch (err) {
    container.innerHTML = `<p>Error loading history: ${err.message}</p>`;
  }
}

// --- Review Notes ---
async function renderReview(container, portalState) {
  container.innerHTML = "<h4>Review Notes</h4><p>Select a note to review.</p>";
  // For demo: could fetch a single note by id
}

// --- Relationships ---
async function renderRelationships(container, portalState) {
  try {
    const res = await fetch(
      `https://client-portal-api.dennis-e64.workers.dev/api/note_relationships?project=${portalState.project}&note_id=${portalState.contactId || ""}`
    );
    const data = await res.json();

    if (data.status !== "ok") {
      container.innerHTML = `<p>Error loading relationships: ${data.error}</p>`;
      return;
    }

    container.innerHTML = "<h4>Note Relationships</h4>";
    const list = document.createElement("ul");
    data.relationships.forEach(r => {
      const li = document.createElement("li");
      li.textContent = `Contact ${r.contact_id} → Role: ${r.role || "n/a"}`;
      list.appendChild(li);
    });
    container.appendChild(list);
  } catch (err) {
    container.innerHTML = `<p>Error loading relationships: ${err.message}</p>`;
  }
}
