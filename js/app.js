import {
  getData,
  createOperation,
  completeOperation
} from "./services/data.service.js";

import { sidebar } from "./components/sidebar.js";
import { topbar } from "./components/topbar.js";

const app = document.querySelector("#app");
const currentPage = document.body.dataset.page || "dashboard";
const isNestedPage = window.location.pathname.includes("/pages/");
const basePath = isNestedPage ? "../" : "";

const pageTitles = {
  dashboard: "Dashboard",
  products: "Products",
  receipts: "Receipts",
  deliveries: "Delivery Orders",
  transfers: "Internal Transfers",
  adjustments: "Inventory Adjustment",
  "move-history": "Move History",
  settings: "Settings"
};

renderPage();

function renderPage() {
  const data = getData();

  if (currentPage === "dashboard") {
    app.innerHTML = `
      <div class="shell">
        ${sidebar(currentPage, basePath)}

        <main class="main">
          ${topbar(pageTitles[currentPage])}

          <div class="page-wrap">
            ${renderDashboard(data)}
          </div>
        </main>
      </div>
    `;

    attachDashboardEvents();
    return;
  }

  app.innerHTML = `
    <div class="shell">
      ${sidebar(currentPage, basePath)}

      <main class="main">
        ${topbar(pageTitles[currentPage] || "StockSense")}

        <div class="page-wrap">
          <div class="page-heading">
            <div>
              <h1>${pageTitles[currentPage] || "StockSense"}</h1>
              <p>This page will be added in the next steps.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;
}

function renderDashboard(data) {
  const totalUnits = data.products.reduce(
    (total, product) => total + Number(product.quantity),
    0
  );

  const lowStockCount = data.products.filter(
    product =>
      Number(product.quantity) > 0 &&
      Number(product.quantity) <= Number(product.reorderLevel)
  ).length;

  const outOfStockCount = data.products.filter(
    product => Number(product.quantity) === 0
  ).length;

  const pendingCount = type =>
    data.operations.filter(
      operation =>
        operation.type === type &&
        operation.status !== "done" &&
        operation.status !== "cancelled"
    ).length;

  const categories = [
    ...new Set(data.products.map(product => product.category))
  ];

  return `
    <section class="page-heading">
      <div>
        <h1>Inventory dashboard</h1>
        <p>Here’s what’s happening across your inventory today.</p>
      </div>

      <button class="btn btn-primary" data-action="new-receipt">
        ＋ New operation
      </button>
    </section>

    ${renderFilters(categories)}

    <section class="kpis">
      ${renderKpiCard(
        "Total units in stock",
        formatNumber(totalUnits),
        "Across your warehouses",
        "green",
        "▦"
      )}

      ${renderKpiCard(
        "Low / out of stock",
        `${lowStockCount} / ${outOfStockCount}`,
        `${lowStockCount} low stock · ${outOfStockCount} out of stock`,
        "red",
        "⚠"
      )}

      ${renderKpiCard(
        "Pending receipts",
        pendingCount("receipt"),
        "Awaiting validation",
        "blue",
        "↙"
      )}

      ${renderKpiCard(
        "Pending deliveries",
        pendingCount("delivery"),
        "Ready to pick or ship",
        "amber",
        "↗"
      )}

      ${renderKpiCard(
        "Transfers scheduled",
        pendingCount("transfer"),
        "Across warehouse locations",
        "",
        "⇄"
      )}
    </section>

    ${renderOperationsTable(data.operations, data.products)}

    ${renderStockTable(data.products)}

    ${renderMovementHistory(data.movements)}
  `;
}

function renderFilters(categories) {
  return `
    <section class="filters">
      <div class="field">
        <label for="filter-type">DOCUMENT TYPE</label>
        <select class="control" id="filter-type">
          <option value="all">All document types</option>
          <option value="receipt">Receipts</option>
          <option value="delivery">Delivery orders</option>
          <option value="transfer">Internal transfers</option>
          <option value="adjustment">Adjustments</option>
        </select>
      </div>

      <div class="field">
        <label for="filter-status">STATUS</label>
        <select class="control" id="filter-status">
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="waiting">Waiting</option>
          <option value="ready">Ready</option>
          <option value="done">Done</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div class="field">
        <label for="filter-warehouse">WAREHOUSE</label>
        <select class="control" id="filter-warehouse">
          <option value="all">All warehouses</option>
          <option value="Main Warehouse">Main Warehouse</option>
          <option value="West Warehouse">West Warehouse</option>
        </select>
      </div>

      <div class="field">
        <label for="filter-category">CATEGORY</label>
        <select class="control" id="filter-category">
          <option value="all">All categories</option>
          ${categories
            .map(
              category =>
                `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`
            )
            .join("")}
        </select>
      </div>
    </section>
  `;
}

function renderKpiCard(label, value, note, color, icon) {
  return `
    <article class="card kpi ${color}">
      <span class="kpi-icon" aria-hidden="true">${icon}</span>
      <div class="kpi-label">${label}</div>
      <div class="kpi-value">${value}</div>
      <div class="kpi-foot">${note}</div>
    </article>
  `;
}

function renderOperationsTable(operations, products) {
  const rows = operations
    .map(operation => {
      const product = products.find(
        item => item.name === operation.productName
      );

      return `
        <tr
          data-operation-type="${operation.type}"
          data-operation-status="${operation.status}"
          data-warehouse="${operation.warehouse}"
          data-category="${product ? product.category : ""}"
        >
          <td class="mono"><strong>${escapeHtml(operation.reference)}</strong></td>
          <td>${formatOperationType(operation.type)}</td>
          <td>${escapeHtml(operation.description)}</td>
          <td>${escapeHtml(operation.productName)}</td>
          <td>
            ${escapeHtml(operation.warehouse)}
            <span class="muted">· ${escapeHtml(operation.location)}</span>
          </td>
          <td>${renderStatusBadge(operation.status)}</td>
          <td>
            ${
              operation.status === "done" ||
              operation.status === "cancelled"
                ? ""
                : `<button
                    class="btn btn-outline"
                    data-action="validate-operation"
                    data-reference="${escapeHtml(operation.reference)}"
                  >Validate</button>`
            }
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <section class="panel operations-panel">
      <header class="panel-head">
        <div>
          <h2>Operations queue</h2>
          <span class="muted">Documents matching the filters above</span>
        </div>

        <a class="btn btn-quiet" href="${basePath}pages/receipts.html">
          Manage operations →
        </a>
      </header>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>REFERENCE</th>
              <th>TYPE</th>
              <th>DETAILS</th>
              <th>PRODUCT</th>
              <th>WAREHOUSE · LOCATION</th>
              <th>STATUS</th>
              <th>ACTION</th>
            </tr>
          </thead>

          <tbody id="operations-table">
            ${rows || renderEmptyRow("No operations to show.", 7)}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderStockTable(products) {
  const rows = products
    .map(product => {
      const quantity = Number(product.quantity);
      const reorderLevel = Number(product.reorderLevel);
      const stockClass = quantity <= reorderLevel ? "qty-low" : "";

      let stockLabel = "In stock";

      if (quantity === 0) {
        stockLabel = "Out of stock";
      } else if (quantity <= reorderLevel) {
        stockLabel = "Low stock";
      }

      return `
        <tr
          data-stock-warehouse="${escapeHtml(product.warehouse)}"
          data-stock-category="${escapeHtml(product.category)}"
        >
          <td><strong>${escapeHtml(product.name)}</strong></td>
          <td class="mono">${escapeHtml(product.sku)}</td>
          <td>${escapeHtml(product.category)}</td>
          <td>${escapeHtml(product.unit)}</td>
          <td>${formatNumber(product.initialStock)}</td>
          <td class="${stockClass}">
            ${formatNumber(quantity)} ${escapeHtml(product.unit)}
          </td>
          <td>
            ${escapeHtml(product.warehouse)}
            <span class="muted">· ${escapeHtml(product.location)}</span>
          </td>
          <td>
            ${formatNumber(reorderLevel)} ${escapeHtml(product.unit)}
          </td>
          <td>${renderStockBadge(stockLabel)}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <section class="panel">
      <header class="panel-head">
        <div>
          <h2>Stock availability per location</h2>
          <span class="muted">Current stock and reorder levels</span>
        </div>

        <a class="btn btn-outline" href="${basePath}pages/products.html">
          View products →
        </a>
      </header>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>PRODUCT</th>
              <th>SKU</th>
              <th>CATEGORY</th>
              <th>UNIT</th>
              <th>INITIAL</th>
              <th>ON HAND</th>
              <th>WAREHOUSE · LOCATION</th>
              <th>REORDER AT</th>
              <th>STATUS</th>
            </tr>
          </thead>

          <tbody id="stock-table">
            ${rows || renderEmptyRow("No products have been added yet.", 9)}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderMovementHistory(movements) {
  const recentMovements = movements.slice(0, 4);

  return `
    <section class="panel history-panel">
      <header class="panel-head">
        <div>
          <h2>Recent move history</h2>
          <span class="muted">Latest stock ledger activity</span>
        </div>

        <a class="btn btn-quiet" href="${basePath}pages/move-history.html">
          Full ledger →
        </a>
      </header>

      <div class="recent-list">
        ${
          recentMovements.length
            ? recentMovements.map(renderMovementRow).join("")
            : `<p class="muted">No stock movements have been recorded yet.</p>`
        }
      </div>
    </section>
  `;
}

function renderMovementRow(movement) {
  const isOutgoing = Number(movement.quantityChange) < 0;
  const sign = isOutgoing ? "" : "+";
  const symbol = isOutgoing ? "−" : "+";
  const movementClass = isOutgoing ? "negative" : "";

  return `
    <div class="move-row">
      <span class="move-dot ${movementClass}">${symbol}</span>

      <div class="move-main">
        <strong>${escapeHtml(movement.productName)}</strong>
        <span>
          ${formatOperationType(movement.type)} ·
          ${escapeHtml(movement.source)} →
          ${escapeHtml(movement.destination)}
        </span>
      </div>

      <strong class="move-qty ${movementClass}">
        ${sign}${formatNumber(Math.abs(Number(movement.quantityChange)))}
      </strong>

      <time>${escapeHtml(movement.timeLabel)}</time>
    </div>
  `;
}

function renderStatusBadge(status) {
  return `<span class="badge badge-${escapeHtml(status)}">${escapeHtml(status)}</span>`;
}

function renderStockBadge(status) {
  const className =
    status === "Out of stock"
      ? "badge-cancelled"
      : status === "Low stock"
        ? "badge-low"
        : "badge-done";

  return `<span class="badge ${className}">${status}</span>`;
}

function renderEmptyRow(message, columnCount) {
  return `
    <tr>
      <td colspan="${columnCount}" class="empty">${message}</td>
    </tr>
  `;
}

function attachDashboardEvents() {
  const filterIds = [
    "filter-type",
    "filter-status",
    "filter-warehouse",
    "filter-category"
  ];

  filterIds.forEach(id => {
    document.querySelector(`#${id}`)?.addEventListener("change", applyFilters);
  });

  app.addEventListener("click", handleDashboardClick);
}

function applyFilters() {
  const selectedType = document.querySelector("#filter-type").value;
  const selectedStatus = document.querySelector("#filter-status").value;
  const selectedWarehouse = document.querySelector("#filter-warehouse").value;
  const selectedCategory = document.querySelector("#filter-category").value;

  document.querySelectorAll("#operations-table tr[data-operation-type]").forEach(row => {
    const matches =
      (selectedType === "all" || row.dataset.operationType === selectedType) &&
      (selectedStatus === "all" || row.dataset.operationStatus === selectedStatus) &&
      (selectedWarehouse === "all" || row.dataset.warehouse === selectedWarehouse) &&
      (selectedCategory === "all" || row.dataset.category === selectedCategory);

    row.hidden = !matches;
  });

  document.querySelectorAll("#stock-table tr[data-stock-warehouse]").forEach(row => {
    const matches =
      (selectedWarehouse === "all" || row.dataset.stockWarehouse === selectedWarehouse) &&
      (selectedCategory === "all" || row.dataset.stockCategory === selectedCategory);

    row.hidden = !matches;
  });
}

function handleDashboardClick(event) {
  const button = event.target.closest("[data-action]");

  if (!button) {
    return;
  }

  if (button.dataset.action === "new-receipt") {
    showOperationForm("receipt");
  }

  if (button.dataset.action === "validate-operation") {
    completeOperation(button.dataset.reference);
    renderPage();
  }
}

function showOperationForm(type) {
  const data = getData();

  const productOptions = data.products
    .map(
      product =>
        `<option value="${escapeHtml(product.name)}">${escapeHtml(product.name)}</option>`
    )
    .join("");

  const modal = document.createElement("div");
  modal.className = "modal-backdrop";

  modal.innerHTML = `
    <section class="modal" role="dialog" aria-modal="true" aria-labelledby="operation-title">
      <header class="modal-head">
        <h2 id="operation-title">Create ${formatOperationType(type)}</h2>
        <button class="icon-button" type="button" data-close-modal aria-label="Close">
          ×
        </button>
      </header>

      <form id="operation-form">
        <div class="modal-content">
          <div class="field">
            <label for="operation-product">PRODUCT</label>
            <select class="control" id="operation-product" name="productName" required>
              ${productOptions}
            </select>
          </div>

          <div class="field">
            <label for="operation-quantity">QUANTITY</label>
            <input
              class="control"
              id="operation-quantity"
              name="quantity"
              type="number"
              min="1"
              step="any"
              required
            >
          </div>

          <div class="field">
            <label for="operation-partner">SUPPLIER / CUSTOMER</label>
            <input
              class="control"
              id="operation-partner"
              name="partner"
              placeholder="Enter a name"
            >
          </div>

          <div class="field">
            <label for="operation-warehouse">WAREHOUSE</label>
            <select class="control" id="operation-warehouse" name="warehouse">
              <option>Main Warehouse</option>
              <option>West Warehouse</option>
            </select>
          </div>

          <div class="field span-2">
            <label for="operation-location">LOCATION</label>
            <input
              class="control"
              id="operation-location"
              name="location"
              value="Rack A"
            >
          </div>
        </div>

        <footer class="modal-foot">
          <button class="btn btn-quiet" type="button" data-close-modal>
            Cancel
          </button>
          <button class="btn btn-primary" type="submit">
            Save operation
          </button>
        </footer>
      </form>
    </section>
  `;

  document.body.append(modal);

  modal.addEventListener("click", event => {
    if (
      event.target === modal ||
      event.target.closest("[data-close-modal]")
    ) {
      modal.remove();
    }
  });

  modal.querySelector("#operation-form").addEventListener("submit", event => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const operation = {
      type,
      productName: formData.get("productName"),
      quantity: Number(formData.get("quantity")),
      partner: formData.get("partner"),
      warehouse: formData.get("warehouse"),
      location: formData.get("location"),
      status: "draft"
    };

    createOperation(operation);
    modal.remove();
    renderPage();
  });
}

function formatOperationType(type) {
  const labels = {
    receipt: "Receipt",
    delivery: "Delivery",
    transfer: "Internal transfer",
    adjustment: "Adjustment"
  };

  return labels[type] || type;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Number(value) || 0);
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