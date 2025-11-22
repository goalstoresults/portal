// tasks.js
export function initTasks({ container, portalState }) {
  const btnAdd = container.querySelector("#btnAddTask");
  const input = container.querySelector("#newTaskText");
  const listDiv = container.querySelector("#tasksList");

  btnAdd.addEventListener("click", async () => {
    const text = input.value.trim();
    if (!text) {
      alert("Task description is required.");
      return;
    }

    try {
      const res = await fetch(
        `https://client-portal-api.dennis-e64.workers.dev/api/tasks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project: portalState.project || "gtr",
            contact_id: portalState.contactId || "",
            task_text: text
          })
        }
      );
      if (!res.ok) {
        alert("Error adding task.");
        return;
      }
      input.value = "";
      await loadTasks();
    } catch (err) {
      console.error("Add task error:", err);
      alert("❌ Failed to add task.");
    }
  });

  async function loadTasks() {
    listDiv.innerHTML = `<div class="card loader">Loading tasks...</div>`;
    try {
      const res = await fetch(
        `https://client-portal-api.dennis-e64.workers.dev/api/tasks?project=${portalState.project || "gtr"}&contact_id=${portalState.contactId || ""}`
      );
      if (!res.ok) {
        listDiv.innerHTML = `<div class="card">Error loading tasks</div>`;
        return;
      }
      const rows = await res.json();
      if (!Array.isArray(rows) || rows.length === 0) {
        listDiv.innerHTML = `<div class="card">No tasks found.</div>`;
        return;
      }
      listDiv.innerHTML = rows.map(r => `
        <div class="card ${r.completed ? "muted" : ""}">
          <div class="row">
            <span>${r.task_text || ""}</span>
            <span class="spacer"></span>
            ${r.completed
              ? `<button onclick="reopenTask('${r.task_id}')">Reopen</button>`
              : `<button onclick="completeTask('${r.task_id}')">Complete</button>`}
          </div>
        </div>
      `).join("");
    } catch (err) {
      console.error("Load tasks error:", err);
      listDiv.innerHTML = `<div class="card">❌ Failed to fetch tasks</div>`;
    }
  }

  // Initial load
  loadTasks();
}

// Global helpers for task actions
window.completeTask = async function(taskId) {
  try {
    await fetch(
      `https://client-portal-api.dennis-e64.workers.dev/api/tasks/${taskId}/complete`,
      { method: "PATCH" }
    );
    alert("Task marked complete.");
    document.querySelector("#tabs button[data-tab='tasks']").click();
  } catch (err) {
    console.error("Complete task error:", err);
    alert("❌ Failed to complete task.");
  }
};

window.reopenTask = async function(taskId) {
  try {
    await fetch(
      `https://client-portal-api.dennis-e64.workers.dev/api/tasks/${taskId}/reopen`,
      { method: "PATCH" }
    );
    alert("Task reopened.");
    document.querySelector("#tabs button[data-tab='tasks']").click();
  } catch (err) {
    console.error("Reopen task error:", err);
    alert("❌ Failed to reopen task.");
  }
};
