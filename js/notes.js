// notes.js
export function initNotes({ container, portalState }) {
  const subtabs = container.querySelectorAll("#notes-subtabs button");
  const notesContent = container.querySelector("#notesContent");

  subtabs.forEach(btn => {
    btn.addEventListener("click", async () => {
      const subtab = btn.dataset.subtab;
      await loadSubtab(subtab);
    });
  });

  async function loadSubtab(subtab) {
    notesContent.innerHTML = `<div class="card loader">Loading ${subtab}...</div>`;

    if (subtab === "add") {
      notesContent.innerHTML = `
        <div class="card">
          <h3>Add Note</h3>
          <textarea id="newNoteText" rows="4" style="width:100%"></textarea>
          <div class="row" style="margin-top:8px;">
            <button id="btnSaveNote" class="primary">Save Note</button>
          </div>
        </div>
      `;
      notesContent.querySelector("#btnSaveNote").addEventListener("click", saveNote);
    }

    else if (subtab === "history") {
      try {
        const res = await fetch(
          `https://client-portal-api.dennis-e64.workers.dev/api/notes-history?project=${portalState.project || "gtr"}&contact_id=${portalState.contactId || ""}`
        );
        if (!res.ok) {
          notesContent.innerHTML = `<div class="card">Error loading notes history</div>`;
          return;
        }
        const rows = await res.json();
        if (!Array.isArray(rows) || rows.length === 0) {
          notesContent.innerHTML = `<div class="card">No notes found.</div>`;
          return;
        }
        notesContent.innerHTML = rows.map(r => `
          <div class="card">
            <div class="row">
              <strong>${r.note_type || "Note"}</strong>
              <span class="spacer"></span>
              <span class="muted">${r.created_at || ""}</span>
            </div>
            <p>${r.note_text || ""}</p>
            <div class="row">
              <button onclick="reviewNote('${r.note_id}')">Review</button>
              <button onclick="relateNote('${r.note_id}')">Relationships</button>
            </div>
          </div>
        `).join("");
      } catch (err) {
        console.error("Notes history error:", err);
        notesContent.innerHTML = `<div class="card">❌ Failed to fetch notes</div>`;
      }
    }

    else if (subtab === "review") {
      notesContent.innerHTML = `
        <div class="card">
          <h3>Note Review</h3>
          <p>Select a note from history to review.</p>
        </div>
      `;
    }

    else if (subtab === "relationships") {
      notesContent.innerHTML = `
        <div class="card">
          <h3>Note Relationships</h3>
          <p>Select a note from history to manage relationships.</p>
        </div>
      `;
    }
  }

  async function saveNote() {
    const text = container.querySelector("#newNoteText").value.trim();
    if (!text) {
      alert("Note text is required.");
      return;
    }
    try {
      const res = await fetch(
        `https://client-portal-api.dennis-e64.workers.dev/api/notes-history`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project: portalState.project || "gtr",
            contact_id: portalState.contactId || "",
            note_text: text
          })
        }
      );
      if (!res.ok) {
        alert("Error saving note.");
        return;
      }
      alert("Note saved successfully.");
      // Reload history after save
      await loadSubtab("history");
    } catch (err) {
      console.error("Save note error:", err);
      alert("❌ Failed to save note.");
    }
  }
}

// Placeholder functions for review/relationships
window.reviewNote = function(noteId) {
  alert(`Review note ${noteId} — hook into review logic later.`);
};
window.relateNote = function(noteId) {
  alert(`Relate note ${noteId} — hook into relationships logic later.`);
};
