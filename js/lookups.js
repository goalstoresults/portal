// lookups.js
export function initLookups({ container, portalState }) {
  const btnLookup = container.querySelector("#btnLookup");
  const input = container.querySelector("#lookupKey");
  const resultsDiv = container.querySelector("#lookupResults");

  btnLookup.addEventListener("click", async () => {
    const key = input.value.trim();
    if (!key) {
      alert("Lookup key is required.");
      return;
    }

    resultsDiv.innerHTML = `<div class="card loader">Searching lookups...</div>`;

    try {
      const res = await fetch(
        `https://client-portal-api.dennis-e64.workers.dev/api/lookups?project=${portalState.project || "gtr"}&key=${encodeURIComponent(key)}`
      );
      if (!res.ok) {
        resultsDiv.innerHTML = `<div class="card">Error fetching lookup results</div>`;
        return;
      }

      const rows = await res.json();
      if (!Array.isArray(rows) || rows.length === 0) {
        resultsDiv.innerHTML = `<div class="card">No results found for "${key}".</div>`;
        return;
      }

      resultsDiv.innerHTML = rows
        .map(
          (r) => `
          <div class="card">
            <div class="row">
              <strong>${r.lookup_key || ""}</strong>
              <span class="spacer"></span>
              <span class="muted">${r.lookup_value || ""}</span>
            </div>
          </div>
        `
        )
        .join("");
    } catch (err) {
      console.error("Lookup error:", err);
      resultsDiv.innerHTML = `<div class="card">❌ Failed to fetch lookups</div>`;
    }
  });
}
