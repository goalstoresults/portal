// loader.js
export async function loadPartial({ containerId, url, vars = {}, afterLoad = null }) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`loadPartial: Container #${containerId} not found`);
    return;
  }

  try {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) {
      console.warn(`loadPartial: Failed to fetch ${url} (${res.status})`);
      container.innerHTML = `<div class="card">Error loading ${url}</div>`;
      return;
    }

    const html = await res.text();
    container.innerHTML = html;

    // Inject vars into container dataset
    Object.entries(vars).forEach(([k, v]) => {
      container.dataset[k] = v == null ? "" : String(v);
    });

    // Optional: auto-fill inputs or spans by id
    Object.entries(vars).forEach(([k, v]) => {
      const el = container.querySelector(`#${k}`);
      if (el) {
        if ("value" in el) el.value = v ?? "";
        else el.textContent = v ?? "";
      }
    });

    // Callback for component-specific behavior
    if (typeof afterLoad === "function") {
      try {
        await afterLoad({ container, vars });
      } catch (e) {
        console.warn(`loadPartial: afterLoad error`, e);
      }
    }
  } catch (e) {
    console.warn(`loadPartial: Exception fetching ${url}`, e);
    container.innerHTML = `<div class="card">Error loading partial</div>`;
  }
}
