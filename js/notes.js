// js/notes.js v1.1.1
export async function loadNotesTab({ portalState, tabContent }) {
  // Load the Notes partial
  await loadPartial("/components/notes.html", tabContent);

  // Initialize Notes subtabs (no preload)
  initNotes(portalState);
}

/* -------------------------
   Internal helpers
------------------------- */

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
  // Initial placeholder: no preload
  const container = document.getElementById("notesContent");
  if (container) {
    container.innerHTML = `<p>Select a subtab to begin.</p>`;
  }

  // Wire subtab buttons
  const subtabs = document.querySelectorAll("#notes-subtabs button");
  subtabs.forEach(btn =>
    btn.addEventListener("click", () => loadNotesSubtab(btn.dataset.subtab, portalState))
  );

  // Disable Review and Relationships until a note is selected
  setSubtabEnabled("review", false);
  setSubtabEnabled("relationships", false);
}

function setSubtabEnabled(subtab, enabled) {
  const btn = document.querySelector(`#notes-subtabs button[data-subtab="${subtab}"]`);
  if (!btn) return;
  btn.disabled = !enabled;
  btn.classList.toggle("disabled", !enabled);
}

/* -------------------------
   Subtab handlers
------------------------- */

async function loadNotesSubtab(subtab, portalState) {
  const container = document.getElementById("notesContent");
  if (!container) return;

  // Guard: project must be set
  if (!portalState.project) {
    container.innerHTML = `<p>No project selected.</p>`;
    return;
  }

  container.innerHTML = `<p>Loading ${subtab}...</p>`;

  if (subtab === "history") {
    await renderHistory(container, portalState);
    return;
  }

  if (subtab === "add") {
    renderAdd(container, portalState);
    return;
  }

  if (subtab === "review") {
    renderReview(container, portalState);
    return;
  }

  if (subtab === "relationships") {
    renderRelationships(container, portalState);
    return;
  }

  container.innerHTML = `<p>Unknown subtab</p>`;
}

/* -------------------------
   History (GET /notes_history)
------------------------- */

async function renderHistory(container, portalState) {
  try {
    // Default filters: last 7 days, needs_review=true
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const params = new URLSearchParams({
      project: portalState.project,
      table: "notes_history",
      start_date: sevenDaysAgo.toISOString(),
      end_date: now.toISOString(),
      needs_review: "true"
    });

    const url = `https://client-portal-api.dennis-e64.workers.dev/api/notes_history?${params.toString()}`;
    const res = await fetch(url, { cache: "no-cache" });
    const data = await res.json();

    if (!res.ok || data.status !== "ok" || !Array.isArray(data.notes)) {
      container.innerHTML = `<p>No notes found.</p>`;
      return;
    }

    if (data.notes.length === 0) {
      container.innerHTML = `<p>No notes found.</p>`;
      return;
    }

    container.innerHTML = `<h4>Notes History</h4>`;
    const list = document.createElement("ul");

    data.notes.forEach(n => {
      const li = document.createElement("li");
      const date = n.created_at ? new Date(n.created_at).toLocaleString() : "(no date)";
      const text = n.note_text || "";
      const id = n.id || "";

      li.innerHTML = `
        <span>${date}: ${escapeHtml(text)}</span>
        <button data-note-id="${id}" class="secondary" style="margin-left:8px;">Select</button>
      `;
      list.appendChild(li);
    });

    container.appendChild(list);

    // Selecting a note enables Review and Relationships
    list.querySelectorAll("button[data-note-id]").forEach(btn =>
      btn.addEventListener("click", () => {
        const selectedId = btn.getAttribute("data-note-id");
        // Store selected note id in state
        portalState.selectedNoteId = selectedId;
        setSubtabEnabled("review", true);
        setSubtabEnabled("relationships", true);
        // Provide quick feedback
        const info = document.createElement("p");
        info.style.marginTop = "8px";
        info.textContent = `Selected note: ${selectedId}`;
        container.appendChild(info);
      })
    );
  } catch (err) {
    container.innerHTML = `<p>Error loading history: ${err.message}</p>`;
  }
}

/* -------------------------
   Add (POST /add_note)
------------------------- */

function renderAdd(container, portalState) {
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
          content
          // No contact_id here — add relationships later via Review/Relationships
        })
      });
      const data = await res.json();
      document.getElementById("noteAddResult").textContent =
        data.success || data.status === "ok"
          ? "Note saved!"
          : `Error: ${data.error || "Unknown error"}`;
    } catch (err) {
      document.getElementById("noteAddResult").textContent = `Error: ${err.message}`;
    }
  });
}

/* -------------------------
   Review (GET /note_review)
------------------------- */

function renderReview(container, portalState) {
  // Require a selected note
  if (!portalState.selectedNoteId) {
    container.innerHTML = `<p>Select a note from History to review.</p>`;
    return;
  }

  container.innerHTML = `
    <h4>Review</h4>
    <p>Note ID: ${portalState.selectedNoteId}</p>
    <div style="margin-top:8px;">
      <button id="btnReviewFetch">Fetch details</button>
    </div>
    <div id="reviewResult" style="margin-top:8px;"></div>
  `;

  document.getElementById("btnReviewFetch").addEventListener("click", async () => {
    try {
      const params = new URLSearchParams({
        project: portalState.project,
        id: portalState.selectedNoteId
      });
      const url = `https://client-portal-api.dennis-e64.workers.dev/api/note_review?${params.toString()}`;
      const res = await fetch(url, { cache: "no-cache" });
      const data = await res.json();
      const result = document.getElementById("reviewResult");

      if (res.ok && (data.success || data.status === "ok") && data.note) {
        result.textContent = `Subject: ${data.note.subject || "(none)"} — Summary: ${data.note.summary || "(none)"}`;
      } else {
        result.textContent = `Error: ${data.error || "Not found"}`;
      }
    } catch (err) {
      document.getElementById("reviewResult").textContent = `Error: ${err.message}`;
    }
  });
}

/* -------------------------
   Relationships (GET /note_relationships)
------------------------- */

function renderRelationships(container, portalState) {
  // Require a selected note
  if (!portalState.selectedNoteId) {
    container.innerHTML = `<p>Select a note from History to view relationships.</p>`;
    return;
  }

  container.innerHTML = `
    <h4>Relationships</h4>
    <p>Note ID: ${portalState.selectedNoteId}</p>
    <div style="margin-top:8px;">
      <button id="btnRelFetch">Fetch relationships</button>
    </div>
    <div id="relResult" style="margin-top:8px;"></div>
  `;

  document.getElementById("btnRelFetch").addEventListener("click", async () => {
    try {
      const params = new URLSearchParams({
        project: portalState.project,
        note_id: portalState.selectedNoteId
      });
      const url = `https://client-portal-api.dennis-e64.workers.dev/api/note_relationships?${params.toString()}`;
      const res = await fetch(url, { cache: "no-cache" });
      const data = await res.json();
      const result = document.getElementById("relResult");

      if (res.ok && (data.status === "ok") && Array.isArray(data.relationships)) {
        const items = data.relationships.map(r =>
          `id ${r.id ?? "?"}: ${r.relationship_type ?? "type?"} — ${r.relationship_role ?? "role?"} — ${r.related_email ?? "email?"}`
        );
        result.innerHTML = items.length
          ? `<ul>${items.map(i => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`
          : "No relationships.";
      } else {
        result.textContent = `Error: ${data.error || "Unknown error"}`;
      }
    } catch (err) {
      document.getElementById("relResult").textContent = `Error: ${err.message}`;
    }
  });
}

/* -------------------------
   Utils
------------------------- */

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
