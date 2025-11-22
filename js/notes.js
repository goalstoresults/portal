// js/notes.js v1.1.3
// Notes module with full Worker URLs (no /api shorthand)

export async function loadNotesTab({ portalState, tabContent }) {
  await loadPartial("/components/notes.html", tabContent);
  initNotes(portalState);
}

async function loadPartial(url, tabContent) {
  try {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const html = await res.text();
    tabContent.innerHTML = html;
    const header = tabContent.querySelector("h2");
    if (header) header.textContent = "Notes (v1.1.3)";
  } catch (err) {
    tabContent.innerHTML = `<section class="card"><p>Error loading partial (${url}): ${err.message}</p></section>`;
  }
}

function initNotes(portalState) {
  const container = document.getElementById("notesContent");
  if (container) container.innerHTML = `<p>Select a subtab to begin.</p>`;
  document.querySelectorAll("#notes-subtabs button").forEach(btn =>
    btn.addEventListener("click", () => loadNotesSubtab(btn.dataset.subtab, portalState))
  );
  setSubtabEnabled("review", false);
  setSubtabEnabled("relationships", false);
}

function setSubtabEnabled(subtab, enabled) {
  const btn = document.querySelector(`#notes-subtabs button[data-subtab="${subtab}"]`);
  if (btn) { btn.disabled = !enabled; btn.classList.toggle("disabled", !enabled); }
}

async function loadNotesSubtab(subtab, portalState) {
  const container = document.getElementById("notesContent");
  if (!container) return;
  if (!portalState.project) { container.innerHTML = `<p>No project selected.</p>`; return; }
  container.innerHTML = `<p>Loading ${subtab}...</p>`;
  if (subtab === "history") return renderHistory(container, portalState);
  if (subtab === "add") return renderAdd(container, portalState);
  if (subtab === "review") return renderReview(container, portalState);
  if (subtab === "relationships") return renderRelationships(container, portalState);
  container.innerHTML = `<p>Unknown subtab</p>`;
}

/* History (GET /notes_history_module) */
async function renderHistory(container, portalState) {
  try {
    const now = new Date(), sevenDaysAgo = new Date(now.getTime() - 7*24*60*60*1000);
    const params = new URLSearchParams({
      project: portalState.project, table: "notes_history",
      start_date: sevenDaysAgo.toISOString(), end_date: now.toISOString(),
      needs_review: "true"
    });
    const url = `https://client-portal-api.dennis-e64.workers.dev/notes_history_module?${params}`;
    const res = await fetch(url, { cache: "no-cache" });
    const data = await res.json();
    if (!res.ok || data.status !== "ok" || !Array.isArray(data.notes) || data.notes.length === 0) {
      container.innerHTML = `<p>No notes found.</p>`; return;
    }
    container.innerHTML = `<h4>Notes History</h4>`;
    const list = document.createElement("ul");
    data.notes.forEach(n => {
      const li = document.createElement("li");
      const date = n.created_at ? new Date(n.created_at).toLocaleString() : "(no date)";
      li.innerHTML = `<span>${date}: ${escapeHtml(n.note_text||"")}</span>
        <button data-note-id="${n.id||""}" class="secondary" style="margin-left:8px;">Select</button>`;
      list.appendChild(li);
    });
    container.appendChild(list);
    list.querySelectorAll("button[data-note-id]").forEach(btn =>
      btn.addEventListener("click", () => {
        portalState.selectedNoteId = btn.getAttribute("data-note-id");
        setSubtabEnabled("review", true); setSubtabEnabled("relationships", true);
        const info = document.createElement("p"); info.style.marginTop="8px";
        info.textContent = `Selected note: ${portalState.selectedNoteId}`; container.appendChild(info);
      })
    );
  } catch (err) { container.innerHTML = `<p>Error loading history: ${err.message}</p>`; }
}

/* Add (POST /notes_history_module) */
function renderAdd(container, portalState) {
  container.innerHTML = `<h4>Add Note</h4>
    <textarea id="noteContent" placeholder="Enter note text..." style="width:100%;min-height:100px;"></textarea>
    <div style="margin-top:8px;"><button id="btnSaveNote" class="primary">Save</button></div>
    <div id="noteAddResult" style="margin-top:8px;"></div>`;
  document.getElementById("btnSaveNote").addEventListener("click", async () => {
    const content = document.getElementById("noteContent").value.trim();
    if (!content) return;
    try {
      const res = await fetch("https://client-portal-api.dennis-e64.workers.dev/notes_history_module", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: portalState.project, content })
      });
      const data = await res.json();
      document.getElementById("noteAddResult").textContent =
        data.success || data.status === "ok" ? "Note saved!" : `Error: ${data.error||"Unknown error"}`;
    } catch (err) { document.getElementById("noteAddResult").textContent = `Error: ${err.message}`; }
  });
}

/* Review (GET /note_review_module) */
function renderReview(container, portalState) {
  if (!portalState.selectedNoteId) { container.innerHTML = `<p>Select a note from History to review.</p>`; return; }
  container.innerHTML = `<h4>Review</h4><p>Note ID: ${portalState.selectedNoteId}</p>
    <div style="margin-top:8px;"><button id="btnReviewFetch">Fetch details</button></div>
    <div id="reviewResult" style="margin-top:8px;"></div>`;
  document.getElementById("btnReviewFetch").addEventListener("click", async () => {
    try {
      const params = new URLSearchParams({ project: portalState.project, id: portalState.selectedNoteId });
      const url = `https://client-portal-api.dennis-e64.workers.dev/note_review_module?${params}`;
      const res = await fetch(url, { cache: "no-cache" }); const data = await res.json();
      const result = document.getElementById("reviewResult");
      if (res.ok && (data.success || data.status==="ok") && data.note) {
        result.textContent = `Subject: ${data.note.subject||"(none)"} — Summary: ${data.note.summary||"(none)"}`;
      } else result.textContent = `Error: ${data.error||"Not found"}`;
    } catch (err) { document.getElementById("reviewResult").textContent = `Error: ${err.message}`; }
  });
}

/* Relationships (GET /note_relationships_module) */
function renderRelationships(container, portalState) {
  if (!portalState.selectedNoteId) { container.innerHTML = `<p>Select a note from History to view relationships.</p>`; return; }
  container.innerHTML = `<h4>Relationships</h4><p>Note ID: ${portalState.selectedNoteId}</p>
    <div style="margin-top:8px;"><button id="btnRelFetch">Fetch relationships</button></div>
    <div id="relResult" style="margin-top:8px;"></div>`;
  document.getElementById("btnRelFetch").addEventListener("click", async () => {
    try {
      const params = new URLSearchParams({ project: portalState.project, note_id: portalState.selectedNoteId });
      const url = `https://client-portal-api.dennis-e64.workers.dev/note_relationships_module?${params}`;
      const res = await fetch(url, { cache: "no-cache" }); const data = await res.json();
      const result = document.getElementById("relResult");
      if (res.ok && data.status==="ok" && Array.isArray(data.relationships)) {
        const items = data.relationships.map(r =>
          `id ${r.id??"?"}: ${r.relationship_type??"type?"} — ${r.relationship_role??"role?"} — ${r.related_email??"email?"}`);
        result.innerHTML = items.length ? `<ul>${items.map(i=>`<li>${escapeHtml(i)}</li>`).join("")}</ul>` : "No relationships.";
      } else result.textContent = `Error: ${data.error||"Unknown error"}`;
    } catch (err) { document.getElementById("relResult").textContent = `Error: ${err.message}`; }
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
