import { supabase } from "../config/supabase.js";
import { escapeHtml } from "../utils/format.js";

export async function renderSettingsPage() {
  const [
    { data: warehouses, error: warehousesError },
    { data: locations, error: locationsError },
    { data: products, error: productsError }
  ] = await Promise.all([
    supabase
      .from("warehouses")
      .select("id, name, location")
      .order("name"),

    supabase
      .from("locations")
      .select(`
        id,
        name,
        warehouse_id,
        warehouses (
          id,
          name
        )
      `)
      .order("name"),

    supabase
      .from("products")
      .select("id, category, initial_location_id")
  ]);

  if (warehousesError) {
    throw new Error(warehousesError.message);
  }

  if (locationsError) {
    throw new Error(locationsError.message);
  }

  if (productsError) {
    throw new Error(productsError.message);
  }

  const warehouseList = warehouses || [];
  const locationList = locations || [];
  const productList = products || [];

  const categories = [
    ...new Set(
      productList
        .map(product => product.category?.trim())
        .filter(Boolean)
    )
  ].sort();

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
            warehouseList.length
              ? warehouseList.map(warehouse => {
                  const warehouseLocations = locationList.filter(
                    location =>
                      location.warehouse_id === warehouse.id
                  );

                  const productCount = productList.filter(
                    product =>
                      warehouseLocations.some(
                        location =>
                          location.id === product.initial_location_id
                      )
                  ).length;

                  return `
                    <article class="setting-row">
                      <span
                        class="warehouse-icon"
                        aria-hidden="true"
                      >⌂</span>

                      <div>
                        <strong>
                          ${escapeHtml(warehouse.name)}
                        </strong>

                        ${
                          warehouse.location
                            ? `
                              <p class="muted">
                                ${escapeHtml(warehouse.location)}
                              </p>
                            `
                            : ""
                        }

                        <p class="muted">
                          ${productCount} tracked products
                          · ${warehouseLocations.length} locations
                        </p>

                        ${
                          warehouseLocations.length
                            ? `
                              <p class="muted">
                                Locations:
                                ${warehouseLocations
                                  .map(
                                    location =>
                                      escapeHtml(location.name)
                                  )
                                  .join(", ")}
                              </p>
                            `
                            : ""
                        }
                      </div>

                      <span class="badge badge-done">
                        Active
                      </span>
                    </article>
                  `;
                }).join("")
              : `
                <p class="empty">
                  No warehouses have been added yet.
                </p>
              `
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
                  const productCount = productList.filter(
                    product =>
                      product.category === category
                  ).length;

                  return `
                    <article class="setting-row">
                      <div>
                        <strong>
                          ${escapeHtml(category)}
                        </strong>

                        <p class="muted">
                          ${productCount} products
                        </p>
                      </div>
                    </article>
                  `;
                }).join("")
              : `
                <p class="empty">
                  No categories have been added yet.
                </p>
              `
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

          <label
            class="switch"
            aria-label="Enable low-stock alerts"
          >
            <input
              type="checkbox"
              id="low-stock-alerts"
              checked
            >

            <span></span>
          </label>
        </header>
      </section>

    </div>
  `;
}

export function attachSettingsPageEvents() {
  document
    .querySelector('[data-action="add-warehouse"]')
    ?.addEventListener("click", () => {
      document.dispatchEvent(
        new CustomEvent("stocksense:add-warehouse")
      );
    });

  document
    .querySelector('[data-action="add-category"]')
    ?.addEventListener("click", () => {
      document.dispatchEvent(
        new CustomEvent("stocksense:add-category")
      );
    });

  const alertToggle =
    document.querySelector("#low-stock-alerts");

  if (alertToggle) {
    const savedValue = localStorage.getItem(
      "stocksense-low-stock-alerts"
    );

    if (savedValue !== null) {
      alertToggle.checked = savedValue === "true";
    }

    alertToggle.addEventListener("change", event => {
      localStorage.setItem(
        "stocksense-low-stock-alerts",
        String(event.currentTarget.checked)
      );
    });
  }
}