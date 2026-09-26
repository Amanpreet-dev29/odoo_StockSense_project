import { productsService } from "../services/products.service.js";
import { escapeHtml, formatNumber } from "../utils/format.js";

/**
 * Build the products page.
 */
export function renderProductsPage() {
  const products = productsService.list();
  const categories = [...new Set(products.map(product => product.category))];

  return `
    <section class="page-heading">
      <div>
        <h1>Products</h1>
        <p>Manage your catalog, stock levels, and reorder rules.</p>
      </div>

      <button class="btn btn-primary" type="button" data-action="add-product">
        ＋ Add product
      </button>
    </section>

    <section class="panel">
      <header class="panel-head">
        <div>
          <h2>Product catalog</h2>
          <span class="muted">${products.length} products</span>
        </div>

        <div class="product-filters">
          <input
            class="control"
            id="product-search"
            type="search"
            placeholder="Search product or SKU…"
          >

          <select class="control" id="product-category">
            <option value="all">All categories</option>
            ${categories
              .map(category => `
                <option value="${escapeHtml(category)}">
                  ${escapeHtml(category)}
                </option>
              `)
              .join("")}
          </select>
        </div>
      </header>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>PRODUCT</th>
              <th>SKU</th>
              <th>CATEGORY</th>
              <th>UNIT</th>
              <th>ON HAND</th>
              <th>WAREHOUSE · LOCATION</th>
              <th>REORDER AT</th>
              <th>STATUS</th>
            </tr>
          </thead>

          <tbody id="product-table">
            ${products.map(renderProductRow).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

/**
 * Attach search, category filter, and add-product events after rendering.
 */
export function attachProductsPageEvents() {
  const searchInput = document.querySelector("#product-search");
  const categorySelect = document.querySelector("#product-category");

  searchInput?.addEventListener("input", filterProductRows);
  categorySelect?.addEventListener("change", filterProductRows);

  document
    .querySelector('[data-action="add-product"]')
    ?.addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("stocksense:add-product"));
    });
}

function renderProductRow(product) {
  const quantity = Number(product.quantity) || 0;
  const reorderLevel = Number(product.reorderLevel) || 0;

  let status = "In stock";
  let statusClass = "badge-done";

  if (quantity === 0) {
    status = "Out of stock";
    statusClass = "badge-cancelled";
  } else if (quantity <= reorderLevel) {
    status = "Low stock";
    statusClass = "badge-low";
  }

  const searchText = `${product.name} ${product.sku}`.toLowerCase();

  return `
    <tr
      data-search="${escapeHtml(searchText)}"
      data-category="${escapeHtml(product.category)}"
    >
      <td><strong>${escapeHtml(product.name)}</strong></td>
      <td class="mono">${escapeHtml(product.sku)}</td>
      <td>${escapeHtml(product.category)}</td>
      <td>${escapeHtml(product.unit)}</td>
      <td class="${quantity <= reorderLevel ? "qty-low" : ""}">
        ${formatNumber(quantity)} ${escapeHtml(product.unit)}
      </td>
      <td>
        ${escapeHtml(product.warehouse)}
        <span class="muted">· ${escapeHtml(product.location)}</span>
      </td>
      <td>${formatNumber(reorderLevel)} ${escapeHtml(product.unit)}</td>
      <td>
        <span class="badge ${statusClass}">${status}</span>
      </td>
    </tr>
  `;
}

function filterProductRows() {
  const searchTerm =
    document.querySelector("#product-search")?.value.trim().toLowerCase() || "";

  const selectedCategory =
    document.querySelector("#product-category")?.value || "all";

  document.querySelectorAll("#product-table tr").forEach(row => {
    const matchesSearch = row.dataset.search.includes(searchTerm);
    const matchesCategory =
      selectedCategory === "all" ||
      row.dataset.category === selectedCategory;

    row.hidden = !(matchesSearch && matchesCategory);
  });
}