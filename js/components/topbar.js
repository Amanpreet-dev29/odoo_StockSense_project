/**
 * Create the StockSense top bar.
 *
 * @param {string} pageTitle - The title of the current page.
 * @returns {string} Top bar HTML.
 */
export function topbar(pageTitle) {
  return `
    <header class="topbar">
      <div class="crumb">
        <button
          class="icon-button mobile-menu"
          type="button"
          aria-label="Open navigation menu"
          data-action="toggle-menu"
        >
          ☰
        </button>

        <span>Inventory</span>
        <span aria-hidden="true">/</span>
        <strong>${escapeHtml(pageTitle)}</strong>
      </div>

      <div class="top-actions">
        <label class="search-wrapper">
          <span class="visually-hidden">Search products or SKU</span>
          <input
            class="global-search"
            id="global-search"
            type="search"
            placeholder="⌕  Search products, SKU…"
            autocomplete="off"
          >
        </label>

        <button
          class="icon-button"
          type="button"
          aria-label="Notifications"
          title="Notifications"
        >
          ♧
        </button>

        <button
          class="profile-button"
          type="button"
          aria-label="Alex Morgan profile"
          title="Alex Morgan"
        >
          <span class="avatar" aria-hidden="true">AM</span>
        </button>
      </div>
    </header>
  `;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return entities[character];
  });
}