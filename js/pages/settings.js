import { productsService } from "../services/products.service.js";
import { escapeHtml } from "../utils/format.js";

/**
 * Build the warehouse and settings page.
 */
export function renderSettingsPage() {
  const products = productsService.list();

  const warehouses = [
    ...new Set(products.map(product => product.warehouse))
  ];

  const categories = [
    ...new Set(products.map(product => product.category))
  ];

  return `
    <section class="page-heading">
      <div>
        <h1>Warehouse & Settings</h1>
        <p>Review your warehouses, locations, and product categories.</p>
      </div>
    </section>

    <div class="settings-grid">
      <section class="panel">
        <header class="panel-head">
          <h2>Warehouses</h2>

          <button
            class="btn btn-outline"
            type="button"
            data-action="add-warehouse"
          >
            ＋ Add warehouse
          </button>
        </header>

        <div class="settings-list">
          ${
            warehouses.length
              ? warehouses.map(warehouse => {
                  const productCount = products.filter(
                    product => product.warehouse === warehouse
                  ).length;

                  return `
                    <article class="setting-row">
                      <span class="warehouse-icon" aria-hidden="true">⌂</span>

                      <div>
                        <strong>${escapeHtml(warehouse)}</strong>
                        <p class="muted">
                          ${productCount} tracked products
                        </p>
                      </div>

                      <span class="badge badge-done">Active</span>
                    </article>
                  `;
                }).join("")
              : `<p class="empty">No warehouses have been added yet.</p>`
          }
        </div>
      </section>

      <section class="panel">
        <header class="panel-head">
          <h2>Product categories</h2>

          <button
            class="btn btn-outline"
            type="button"
            data-action="add-category"
          >
            ＋ Add category
          </button>
        </header>

        <div class="settings-list">
          ${
            categories.length
              ? categories.map(category => {
                  const productCount = products.filter(
                    product => product.category === category
                  ).length;

                  return `
                    <article class="setting-row">
                      <div>
                        <strong>${escapeHtml(category)}</strong>
                        <p class="muted">
                          ${productCount} products
                        </p>
                      </div>
                    </article>
                  `;
                }).join("")
              : `<p class="empty">No categories have been added yet.</p>`
          }
        </div>
      </section>

      <section class="panel settings-span">
        <header class="panel-head">
          <div>
            <h2>Low-stock alerts</h2>
            <p class="muted">
              Show an alert when a product reaches its reorder level.
            </p>
          </div>

          <label class="switch" aria-label="Enable low-stock alerts">
            <input type="checkbox" id="low-stock-alerts" checked>
            <span></span>
          </label>
        </header>
      </section>
    </div>
  `;
}

/**
 * Attach the settings page controls after rendering.
 */
export function attachSettingsPageEvents() {
  document
    .querySelector('[data-action="add-warehouse"]')
    ?.addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("stocksense:add-warehouse"));
    });

  document
    .querySelector('[data-action="add-category"]')
    ?.addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("stocksense:add-category"));
    });

  document
    .querySelector("#low-stock-alerts")
    ?.addEventListener("change", event => {
      localStorage.setItem(
        "stocksense-low-stock-alerts",
        String(event.currentTarget.checked)
      );
    });
}