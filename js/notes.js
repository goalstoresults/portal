// js/notes.js v1.1.0
export async function loadNotesTab({ portalState, tabContent }) {
  // Load the Notes partial
  await loadPartial("/components/notes.html", tabContent);

  // Initialize Notes subtabs
  initNotes(portalState);
}

// --- Internal helpers ---

async function loadPartial(url, tabContent) {
  try {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const html = await res.text();
    tabContent.innerHTML = html;
  } catch (err) {
    tabContent.innerHTML = `<section class="card"><p>Error loading partial (${url}): ${err.message}</p></section>`;
  }
}

function initNotes(portalState) {
  const container = document.getElementById("notesContent");
  const subtabs = document.querySelectorAll("#notes-subtabs button");

  subtabs.forEach(btn =>
    btn.addEventListener("click", () => loadNotesSubtab(btn.dataset.subtab, portalState))
  );

  // Default view
  loadNotesSubtab("history", portalState);
}

async function loadNotesSubtab(subtab, portalState) {
  const container = document.getElementById("notesContent");
  if (!container) return;
  container.innerHTML = `<p>Loading ${subtab}...</p>`;

  if (subtab === "history") {
    try {
      const url = `https://client-portal-api.dennis-e64.workers.dev/api/notes?project=${encodeURIComponent(portalState.project)}&contact_id=${encodeURIComponent(portalState.contactId || "")}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.success || !Array.isArray(data.notes)) {
        container.innerHTML = `<p>No notes found.</p>`;
        return;
      }
      container.innerHTML = "<h4>Notes History</h4>";
      const list = document.createElement("ul");
      data.notes.forEach(n => {
        const li = document.createElement("li");
        const date = n.created_at ? new Date(n.created_at).toLocaleString() : "(no date)";
        li.textContent = `${date}: ${n.note_text || ""}`;
        list.appendChild(li);
      });
      container.appendChild(list);
    } catch (err) {
      container.innerHTML = `<p>Error loading history: ${err.message}</p>`;
    }
    return;
  }

  if (subtab === "add") {
    container.innerHTML = `
      <h4>Add Note</h4>
      <textarea id="noteContent" placeholder="Enter note text..." style="width:100%;min-height:100px;"></textarea>
      <div style="margin-top:8px;">
        <button id="btnSaveNote" class="primary">Save</button>
      </div>
      <div id="noteAddResult" style="margin-top:8px;"></div>
    `;
    document.getElementById("btnSaveNote").addEventListener("click", async () => {
      const content = document.getElementById("noteContent").value.trim();
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
          data.success ? "Note saved!" : `Error: ${data.error || "Unknown error"}`;
      } catch (err) {
        document.getElementById("noteAddResult").textContent = `Error: ${err.message}`;
      }
    });
    return;
  }

  if (subtab === "review") {
    container.innerHTML = `
      <h4>Review</h4>
      <p>Enter a note id to fetch review details:</p>
      <input id="reviewNoteId" placeholder="Note ID" />
      <button id="btnReviewFetch">Fetch</button>
      <div id="reviewResult" style="margin-top:8px;"></div>
    `;
    document.getElementById("btnReviewFetch").addEventListener("click", async () => {
      const id = document.getElementById("reviewNoteId").value.trim();
      if (!id) return;
      try {
        const url = `https://client-portal-api.dennis-e64.workers.dev/api/note_review?project=${encodeURIComponent(portalState.project)}&id=${encodeURIComponent(id)}`;
        const res = await fetch(url);
        const data = await res.json();
        const result = document.getElementById("reviewResult");
        if (data.success && data.note) {
          result.textContent = `Subject: ${data.note.subject || "(none)"} — Summary: ${data.note.summary || "(none)"}`;
        } else {
          result.textContent = `Error: ${data.error || "Not found"}`;
        }
      } catch (err) {
        document.getElementById("reviewResult").textContent = `Error: ${err.message}`;
      }
    });
    return;
  }

  if (subtab === "relationships") {
    container.innerHTML = `
      <h4>Relationships</h4>
      <p>Enter a note id to fetch relationships:</p>
      <input id="relNoteId" placeholder="Note ID" />
      <button id="btnRelFetch">Fetch</button>
      <div id="relResult" style="margin-top:8px;"></div>
    `;
    document.getElementById("btnRelFetch").addEventListener("click", async () => {
      const noteId = document.getElementById("relNoteId").value.trim();
      if (!noteId) return;
      try {
        const url = `https://client-portal-api.dennis-e64.workers.dev/api/note_relationships?project=${encodeURIComponent(portalState.project)}&note_id=${encodeURIComponent(noteId)}`;
        const res = await fetch(url);
        const data = await res.json();
        const result = document.getElementById("relResult");
        if (data.status === "ok" && Array.isArray(data.relationships)) {
          const items = data.relationships.map(r => `id ${r.id ?? "?"}: ${r.relationship_type ?? "type?"} — ${r.relationship_role ?? "role?"} — ${r.related_email ?? "email?"}`);
          result.innerHTML = items.length ? `<ul>${items.map(i => `<li>${i}</li>`).join("")}</ul>` : "No relationships.";
        } else {
          result.textContent = `Error: ${data.error || "Unknown error"}`;
        }
      } catch (err) {
        document.getElementById("relResult").textContent = `Error: ${err.message}`;
      }
    });
    return;
  }

  container.innerHTML = `<p>Unknown subtab</p>`;
}
