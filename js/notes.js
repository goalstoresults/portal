// notes.js v1.1.3

export async function loadNotesTab({ portalState, tabContent }) {
  tabContent.innerHTML = `
    <section class="card">
      <h2>Notes (v1.0.8)</h2>
      <div class="tabs">
        <button id="tabAdd" class="primary">Add</button>
        <button id="tabHistory">History</button>
        <button id="tabReview">Review</button>
        <button id="tabRelationships">Relationships</button>
      </div>
      <div id="notesSubtab"></div>
    </section>
  `;

  const notesSubtab = document.getElementById("notesSubtab");

  // Wire subtabs
  document.getElementById("tabAdd").addEventListener("click", () => renderAdd(notesSubtab, portalState));
  document.getElementById("tabHistory").addEventListener("click", () => renderHistory(notesSubtab, portalState));
  document.getElementById("tabReview").addEventListener("click", () => renderReview(notesSubtab, portalState));
  document.getElementById("tabRelationships").addEventListener("click", () => renderRelationships(notesSubtab, portalState));

  // Default to Add
  renderAdd(notesSubtab, portalState);
}

/* -------------------------
   ADD NOTE
------------------------- */
function renderAdd(container, portalState) {
  container.innerHTML = `
    <h3>Add Note</h3>
    <textarea id="noteContent" rows="8" style="width:100%;"></textarea>
    <button id="btnSaveNote">Save</button>
    <div id="noteAddResult" style="margin-top:10px; color:#900;"></div>
  `;

  document.getElementById("btnSaveNote").addEventListener("click", async () => {
    const content = document.getElementById("noteContent").value.trim();
    const project = portalState.project;

    console.log("📝 Attempting to save note:", { project, content });

    if (!project) {
      document.getElementById("noteAddResult").textContent = "Error: Missing project.";
      return;
    }
    if (!content) {
      document.getElementById("noteAddResult").textContent = "Error: Missing content.";
      return;
    }

    try {
      const res = await fetch("https://client-portal-api.dennis-e64.workers.dev/api/notes_history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project, content })
      });

      const data = await res.json().catch(() => null);
      console.log("📬 Add Note response:", res.status, data);

      if (res.ok && data?.status === "ok") {
        document.getElementById("noteAddResult").style.color = "#090";
        document.getElementById("noteAddResult").textContent = "Note saved successfully!";
      } else {
        document.getElementById("noteAddResult").style.color = "#900";
        document.getElementById("noteAddResult").textContent = `Error: ${data?.error || "Unknown error"}`;
      }
    } catch (err) {
      console.error("🔥 Add Note error:", err);
      document.getElementById("noteAddResult").style.color = "#900";
      document.getElementById("noteAddResult").textContent = `Error: ${err.message}`;
    }
  });
}

/* -------------------------
   HISTORY
------------------------- */
function renderHistory(container, portalState) {
  container.innerHTML = `
    <h3>Note History</h3>
    <div id="noteHistoryResult">Loading...</div>
  `;

  const project = portalState.project;
  fetch(`https://client-portal-api.dennis-e64.workers.dev/api/notes_history?project=${project}`)
    .then(res => res.json())
    .then(data => {
      console.log("📜 History response:", data);
      if (data.status === "ok") {
        const notes = data.notes;
        document.getElementById("noteHistoryResult").innerHTML =
          notes.map(n => `<p><strong>${n.created_at}</strong>: ${n.note_text}</p>`).join("");
      } else {
        document.getElementById("noteHistoryResult").textContent = `Error: ${data.error}`;
      }
    })
    .catch(err => {
      console.error("🔥 History error:", err);
      document.getElementById("noteHistoryResult").textContent = `Error: ${err.message}`;
    });
}

/* -------------------------
   REVIEW
------------------------- */
function renderReview(container, portalState) {
  container.innerHTML = `
    <h3>Review Notes</h3>
    <div id="noteReviewResult">Coming soon...</div>
  `;
}

/* -------------------------
   RELATIONSHIPS
------------------------- */
function renderRelationships(container, portalState) {
  container.innerHTML = `
    <h3>Note Relationships</h3>
    <div id="noteRelationshipsResult">Coming soon...</div>
  `;
}
